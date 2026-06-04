"""clientes: endereço estruturado (ViaCEP) para analytics geográfica

Revision ID: 0004_cliente_endereco
Revises: 0003_venda_entrega
Create Date: 2026-05-31
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004_cliente_endereco"
down_revision: Union[str, None] = "0003_venda_entrega"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLS = ["cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf"]


def upgrade() -> None:
    for c in COLS:
        op.add_column("clientes", sa.Column(c, sa.Text(), nullable=True))
    op.create_index("idx_clientes_cidade", "clientes", ["usuario_id", "cidade"])


def downgrade() -> None:
    op.drop_index("idx_clientes_cidade", table_name="clientes")
    for c in reversed(COLS):
        op.drop_column("clientes", c)
