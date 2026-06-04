"""Movimentação de estoque com registro em ledger (estoque_movimentos)."""
from sqlalchemy.orm import Session

from .models import EstoqueMovimento, Produto


def aplicar_movimento(
    db: Session, usuario_id: int, produto: Produto, delta: float,
    origem: str, venda_id: int | None = None, tipo: str | None = None,
) -> EstoqueMovimento | None:
    """Soma `delta` (assinado) ao estoque do produto e registra a movimentação.
    delta > 0 = entrada, delta < 0 = saída. Retorna None se delta == 0."""
    delta = round(float(delta), 2)
    if delta == 0:
        return None
    produto.estoque = round(float(produto.estoque) + delta, 2)
    mov = EstoqueMovimento(
        usuario_id=usuario_id, produto_id=produto.id, produto_nome=produto.nome,
        tipo=tipo or ("entrada" if delta > 0 else "saida"),
        quantidade=delta, saldo_apos=produto.estoque, origem=origem, venda_id=venda_id,
    )
    db.add(mov)
    return mov
