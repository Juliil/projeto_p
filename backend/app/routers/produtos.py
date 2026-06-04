from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..estoque import aplicar_movimento
from ..models import Produto, Usuario
from ..schemas import ProdutoIn, ProdutoOut
from ..security import get_current_user

router = APIRouter(prefix="/api/produtos", tags=["produtos"])


@router.get("", response_model=list[ProdutoOut])
def listar(db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    return (
        db.query(Produto)
        .filter(Produto.usuario_id == usuario.id)
        .order_by(Produto.criado_em.desc())
        .all()
    )


@router.post("", response_model=ProdutoOut, status_code=201)
def criar(dados: ProdutoIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    dump = dados.model_dump()
    estoque_inicial = dump.pop("estoque", 0) or 0
    produto = Produto(usuario_id=usuario.id, estoque=0, **dump)
    db.add(produto)
    db.flush()
    if estoque_inicial:
        aplicar_movimento(db, usuario.id, produto, estoque_inicial, origem="cadastro", tipo="entrada")
    db.commit()
    db.refresh(produto)
    return produto


@router.put("/{produto_id}", response_model=ProdutoOut)
def atualizar(produto_id: int, dados: ProdutoIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    produto = db.get(Produto, produto_id)
    if not produto or produto.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    dump = dados.model_dump()
    novo_estoque = dump.pop("estoque", float(produto.estoque))
    for k, v in dump.items():
        setattr(produto, k, v)
    delta = round(float(novo_estoque) - float(produto.estoque), 2)
    if delta:
        aplicar_movimento(db, usuario.id, produto, delta, origem="edicao_produto")
    db.commit()
    db.refresh(produto)
    return produto


@router.delete("/{produto_id}", status_code=204)
def remover(produto_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    produto = db.get(Produto, produto_id)
    if not produto or produto.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    db.delete(produto)
    db.commit()
