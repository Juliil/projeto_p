"""clientes (CRM) + pré-venda/reserva nas vendas

Revision ID: 0002_clientes_prevenda
Revises: 0001_baseline_hazak
Create Date: 2026-05-31
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_clientes_prevenda"
down_revision: Union[str, None] = "0001_baseline_hazak"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "clientes",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("usuario_id", sa.BigInteger(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nome", sa.Text(), nullable=False),
        sa.Column("telefone", sa.Text(), nullable=True),
        sa.Column("padrao", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("criado_em", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_clientes_usuario", "clientes", ["usuario_id"])

    # vendas ganham vínculo com cliente + pré-venda
    op.add_column("vendas", sa.Column("cliente_id", sa.BigInteger(), sa.ForeignKey("clientes.id", ondelete="SET NULL"), nullable=True))
    op.add_column("vendas", sa.Column("status", sa.Text(), nullable=False, server_default="concluida"))
    op.add_column("vendas", sa.Column("reserva_expira_em", sa.TIMESTAMP(timezone=True), nullable=True))

    # seed: cada loja existente ganha o cliente padrão "Consumidor"
    op.execute("INSERT INTO clientes (usuario_id, nome, padrao) SELECT id, 'Consumidor', true FROM usuarios")


def downgrade() -> None:
    op.drop_column("vendas", "reserva_expira_em")
    op.drop_column("vendas", "status")
    op.drop_column("vendas", "cliente_id")
    op.drop_index("idx_clientes_usuario", table_name="clientes")
    op.drop_table("clientes")
