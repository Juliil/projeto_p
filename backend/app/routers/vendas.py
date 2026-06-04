from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..estoque import aplicar_movimento
from ..models import Cliente, Produto, Usuario, Venda
from ..schemas import EntregaIn, VendaIn, VendaOut
from ..security import get_current_user
from .clientes import cliente_padrao

router = APIRouter(prefix="/api/vendas", tags=["vendas"])

PAGAMENTOS = ("pix", "dinheiro", "credito", "debito")
RESERVA_HORAS = 24


def _expirar_reservas(db: Session, usuario_id: int) -> None:
    """Pré-vendas não confirmadas em 24h expiram e devolvem o estoque (lazy)."""
    agora = datetime.now(timezone.utc)
    vencidas = (
        db.query(Venda)
        .filter(Venda.usuario_id == usuario_id, Venda.status == "pre_venda", Venda.reserva_expira_em < agora)
        .all()
    )
    for v in vencidas:
        for it in v.itens or []:
            produto = db.get(Produto, it.get("produto_id"))
            if produto and produto.usuario_id == usuario_id:
                aplicar_movimento(db, usuario_id, produto, float(it.get("quantidade", 0)),
                                  origem="expiracao", venda_id=v.id, tipo="entrada")
        v.status = "expirada"
    if vencidas:
        db.commit()


@router.get("", response_model=list[VendaOut])
def listar(db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _expirar_reservas(db, usuario.id)
    return (
        db.query(Venda)
        .filter(Venda.usuario_id == usuario.id)
        .order_by(Venda.criado_em.desc())
        .all()
    )


@router.post("", response_model=VendaOut, status_code=201)
def criar(dados: VendaIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    if dados.forma_pagamento not in PAGAMENTOS:
        raise HTTPException(status_code=400, detail=f"forma_pagamento deve ser uma de {PAGAMENTOS}")
    if not dados.itens:
        raise HTTPException(status_code=400, detail="A venda precisa de ao menos um item")

    # resolve cliente (vazio = Consumidor padrão)
    if dados.cliente_id:
        cliente = db.get(Cliente, dados.cliente_id)
        if not cliente or cliente.usuario_id != usuario.id:
            raise HTTPException(status_code=404, detail="Cliente inválido")
    else:
        cliente = cliente_padrao(db, usuario.id)

    # valida itens + estoque antes de baixar
    itens_calc, total, produtos = [], 0.0, {}
    for item in dados.itens:
        produto = db.get(Produto, item.produto_id)
        if not produto or produto.usuario_id != usuario.id:
            raise HTTPException(status_code=404, detail=f"Produto {item.produto_id} inválido")
        if item.quantidade <= 0:
            raise HTTPException(status_code=400, detail="Quantidade deve ser positiva")
        if float(produto.estoque) < item.quantidade:
            raise HTTPException(status_code=400, detail=f"Estoque insuficiente de '{produto.nome}' (tem {produto.estoque})")
        produtos[item.produto_id] = produto
        preco = float(produto.preco_venda)
        subtotal = round(preco * item.quantidade, 2)
        total += subtotal
        itens_calc.append({"produto_id": produto.id, "nome": produto.nome,
                           "quantidade": item.quantidade, "preco_unit": preco, "subtotal": subtotal})

    pre = dados.pre_venda
    venda = Venda(
        usuario_id=usuario.id, cliente_id=cliente.id, cliente_nome=cliente.nome,
        forma_pagamento=dados.forma_pagamento, total=round(total, 2), itens=itens_calc,
        status="pre_venda" if pre else "concluida",
        reserva_expira_em=(datetime.now(timezone.utc) + timedelta(hours=RESERVA_HORAS)) if pre else None,
    )
    db.add(venda)
    db.flush()

    # reserva (pré-venda) ou venda baixam o estoque na hora
    origem = "pre_venda" if pre else "venda"
    for item in dados.itens:
        aplicar_movimento(db, usuario.id, produtos[item.produto_id], -item.quantidade,
                          origem=origem, venda_id=venda.id, tipo="saida")

    db.commit()
    db.refresh(venda)
    return venda


@router.patch("/{venda_id}/confirmar", response_model=VendaOut)
def confirmar(venda_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    venda = db.get(Venda, venda_id)
    if not venda or venda.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    if venda.status == "concluida":
        return venda
    if venda.status != "pre_venda":
        raise HTTPException(status_code=400, detail="Só é possível confirmar uma pré-venda")
    if venda.reserva_expira_em and venda.reserva_expira_em < datetime.now(timezone.utc):
        _expirar_reservas(db, usuario.id)
        raise HTTPException(status_code=409, detail="Pré-venda expirada (passou de 24h) — registre novamente")
    # estoque já foi reservado na criação; confirmar apenas conclui
    venda.status = "concluida"
    venda.reserva_expira_em = None
    db.commit()
    db.refresh(venda)
    return venda


@router.patch("/{venda_id}/entrega", response_model=VendaOut)
def definir_entrega(venda_id: int, dados: EntregaIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    venda = db.get(Venda, venda_id)
    if not venda or venda.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    if dados.tipo not in ("retirada", "entrega"):
        raise HTTPException(status_code=400, detail="tipo deve ser 'retirada' ou 'entrega'")
    if dados.status not in ("pendente", "agendada", "concluida"):
        raise HTTPException(status_code=400, detail="status de entrega inválido")
    if dados.tipo == "entrega" and dados.status == "agendada" and not dados.data:
        raise HTTPException(status_code=400, detail="Informe a data da entrega para agendar")
    venda.entrega_tipo = dados.tipo
    venda.entrega_status = dados.status
    venda.entrega_data = dados.data
    venda.entrega_endereco = (dados.endereco or "").strip() or None
    db.commit()
    db.refresh(venda)
    return venda


@router.get("/{venda_id}", response_model=VendaOut)
def obter(venda_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    venda = db.get(Venda, venda_id)
    if not venda or venda.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return venda
