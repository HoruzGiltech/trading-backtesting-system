"""add no-trade days to backtest entries and trades

Revision ID: b8e4f2a3c5d6
Revises: a7d3e1f2b4c5
Create Date: 2026-10-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8e4f2a3c5d6'
down_revision: Union[str, Sequence[str], None] = 'a7d3e1f2b4c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TRADE_COLUMNS = [
    ('symbol', sa.String()),
    ('side', sa.String()),
    ('volume', sa.Numeric(precision=10, scale=2)),
    ('open_price', sa.Numeric(precision=14, scale=6)),
    ('close_price', sa.Numeric(precision=14, scale=6)),
]


def upgrade() -> None:
    """Upgrade schema."""
    # ALTER TYPE ... ADD VALUE debe confirmarse antes de poder usar el valor nuevo
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE resulttype ADD VALUE IF NOT EXISTS 'NO_TRADE'")

    for name, type_ in _TRADE_COLUMNS:
        op.alter_column('trades', name, existing_type=type_, nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM trades WHERE result = 'NO_TRADE'")
    for name, type_ in _TRADE_COLUMNS:
        op.alter_column('trades', name, existing_type=type_, nullable=False)

    # Postgres no permite quitar un valor de un enum: se borran las filas y el valor queda sin uso
    op.execute("DELETE FROM backtest_entries WHERE result = 'NO_TRADE'")
