"""Vitrine pública — catálogo das bolsas disponíveis, sem login.
Pensada para compartilhar no Instagram (link/QR). Mostra só produtos ativos
com estoque, sem dados internos (custo, etc.)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Produto, Usuario

router = APIRouter(prefix="/api/vitrine", tags=["vitrine"])


@router.get("/produtos")
def vitrine(loja: Optional[int] = None, db: Session = Depends(get_db)):
    # loja default: a primeira cadastrada (PoC de loja única)
    usuario = (
        db.get(Usuario, loja) if loja
        else db.query(Usuario).order_by(Usuario.id.asc()).first()
    )
    if not usuario:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    produtos = (
        db.query(Produto)
        .filter(Produto.usuario_id == usuario.id, Produto.ativo.is_(True), Produto.estoque > 0)
        .order_by(Produto.criado_em.desc())
        .all()
    )
    perfil = usuario.perfil or {}
    return {
        "loja": {"id": usuario.id, "nome": perfil.get("nome_loja") or usuario.nome, "cidade": perfil.get("cidade") or "Manaus"},
        "produtos": [
            {
                "id": p.id, "nome": p.nome, "categoria": p.categoria,
                "descricao": p.descricao, "foto_url": p.foto_url, "preco_venda": float(p.preco_venda),
            }
            for p in produtos
        ],
    }
