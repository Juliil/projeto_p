from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Cliente, Usuario, Venda
from ..schemas import ClienteIn, ClienteOut, ClienteResumoOut
from ..security import get_current_user

router = APIRouter(prefix="/api/clientes", tags=["clientes"])

ENDERECO = ["cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf"]


def cliente_padrao(db: Session, usuario_id: int) -> Cliente:
    """Retorna (criando se preciso) o cliente 'Consumidor' da loja."""
    c = db.query(Cliente).filter(Cliente.usuario_id == usuario_id, Cliente.padrao.is_(True)).first()
    if not c:
        c = Cliente(usuario_id=usuario_id, nome="Consumidor", padrao=True)
        db.add(c)
        db.flush()
    return c


def _limpa(v):
    return (v or "").strip() or None


@router.get("", response_model=list[ClienteResumoOut])
def listar(db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    """Clientes da loja com resumo de compras (base de analytics/recompra)."""
    concl = case((Venda.status == "concluida", 1), else_=None)
    rows = (
        db.query(
            Cliente,
            func.count(concl).label("total_compras"),
            func.coalesce(func.sum(case((Venda.status == "concluida", Venda.total), else_=0)), 0).label("total_gasto"),
            func.max(case((Venda.status == "concluida", Venda.criado_em), else_=None)).label("ultima_compra"),
        )
        .outerjoin(Venda, Venda.cliente_id == Cliente.id)
        .filter(Cliente.usuario_id == usuario.id)
        .group_by(Cliente.id)
        .order_by(Cliente.padrao.desc(), func.max(Venda.criado_em).desc().nullslast())
        .all()
    )
    return [
        ClienteResumoOut(
            id=c.id, nome=c.nome, telefone=c.telefone, padrao=c.padrao,
            cep=c.cep, logradouro=c.logradouro, numero=c.numero, complemento=c.complemento,
            bairro=c.bairro, cidade=c.cidade, uf=c.uf,
            total_compras=int(total or 0), total_gasto=float(gasto or 0), ultima_compra=ultima,
        )
        for c, total, gasto, ultima in rows
    ]


@router.post("", response_model=ClienteOut, status_code=201)
def criar(dados: ClienteIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    if not dados.nome.strip():
        raise HTTPException(status_code=400, detail="Informe o nome do cliente")
    cliente = Cliente(usuario_id=usuario.id, nome=dados.nome.strip(), telefone=_limpa(dados.telefone))
    for c in ENDERECO:
        setattr(cliente, c, _limpa(getattr(dados, c)))
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.put("/{cliente_id}", response_model=ClienteOut)
def atualizar(cliente_id: int, dados: ClienteIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    cliente = db.get(Cliente, cliente_id)
    if not cliente or cliente.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    cliente.nome = dados.nome.strip() or cliente.nome
    cliente.telefone = _limpa(dados.telefone)
    for c in ENDERECO:
        setattr(cliente, c, _limpa(getattr(dados, c)))
    db.commit()
    db.refresh(cliente)
    return cliente
