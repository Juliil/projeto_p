"""baseline — schema do Hazak (projeto_p)

Revision ID: 0001_baseline_hazak
Revises:
Create Date: 2026-05-31
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_baseline_hazak"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "usuarios",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.Text(), nullable=False, unique=True),
        sa.Column("senha_hash", sa.Text(), nullable=False),
        sa.Column("nome", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False, server_default="ativo"),
        sa.Column("perfil", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("criado_em", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "produtos",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("usuario_id", sa.BigInteger(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nome", sa.Text(), nullable=False),
        sa.Column("categoria", sa.Text(), nullable=True),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("foto_url", sa.Text(), nullable=True),
        sa.Column("preco_venda", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("custo", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("estoque", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("estoque_minimo", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("criado_em", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_produtos_usuario", "produtos", ["usuario_id"])

    op.create_table(
        "vendas",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("usuario_id", sa.BigInteger(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("cliente_nome", sa.Text(), nullable=True),
        sa.Column("forma_pagamento", sa.Text(), nullable=False, server_default="pix"),
        sa.Column("total", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("itens", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("nf_numero", sa.Text(), nullable=True),
        sa.Column("nf_emitida_em", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("criado_em", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_vendas_usuario", "vendas", ["usuario_id", "criado_em"])

    op.create_table(
        "estoque_movimentos",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("usuario_id", sa.BigInteger(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("produto_id", sa.BigInteger(), sa.ForeignKey("produtos.id", ondelete="SET NULL"), nullable=True),
        sa.Column("produto_nome", sa.Text(), nullable=False),
        sa.Column("tipo", sa.Text(), nullable=False),
        sa.Column("quantidade", sa.Numeric(12, 2), nullable=False),
        sa.Column("saldo_apos", sa.Numeric(12, 2), nullable=False),
        sa.Column("origem", sa.Text(), nullable=False),
        sa.Column("venda_id", sa.BigInteger(), sa.ForeignKey("vendas.id", ondelete="SET NULL"), nullable=True),
        sa.Column("criado_em", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_estoque_mov_usuario", "estoque_movimentos", ["usuario_id", "criado_em"])


def downgrade() -> None:
    op.drop_table("estoque_movimentos")
    op.drop_table("vendas")
    op.drop_index("idx_produtos_usuario", table_name="produtos")
    op.drop_table("produtos")
    op.drop_table("usuarios")
