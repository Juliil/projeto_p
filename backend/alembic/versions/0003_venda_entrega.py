"""vendas: entrega/retirada (tipo, status, data agendada, endereço)

Revision ID: 0003_venda_entrega
Revises: 0002_clientes_prevenda
Create Date: 2026-05-31
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_venda_entrega"
down_revision: Union[str, None] = "0002_clientes_prevenda"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("vendas", sa.Column("entrega_tipo", sa.Text(), nullable=True))
    op.add_column("vendas", sa.Column("entrega_status", sa.Text(), nullable=False, server_default="pendente"))
    op.add_column("vendas", sa.Column("entrega_data", sa.Date(), nullable=True))
    op.add_column("vendas", sa.Column("entrega_endereco", sa.Text(), nullable=True))
    op.create_index("idx_vendas_entrega", "vendas", ["usuario_id", "entrega_data"])


def downgrade() -> None:
    op.drop_index("idx_vendas_entrega", table_name="vendas")
    op.drop_column("vendas", "entrega_endereco")
    op.drop_column("vendas", "entrega_data")
    op.drop_column("vendas", "entrega_status")
    op.drop_column("vendas", "entrega_tipo")
