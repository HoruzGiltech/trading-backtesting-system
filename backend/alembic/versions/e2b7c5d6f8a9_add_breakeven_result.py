"""add breakeven result to backtest entries

Revision ID: e2b7c5d6f8a9
Revises: d1a6b4c5e7f8
Create Date: 2026-10-16 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'e2b7c5d6f8a9'
down_revision: Union[str, Sequence[str], None] = 'd1a6b4c5e7f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ALTER TYPE ... ADD VALUE debe confirmarse antes de poder usar el valor nuevo
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE resulttype ADD VALUE IF NOT EXISTS 'BE'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres no permite quitar un valor de un enum; las filas BE pasan a SL o TP según el monto
    op.execute(
        "UPDATE backtest_entries SET result = CASE WHEN amount < 0 THEN 'SL'::resulttype ELSE 'TP'::resulttype END "
        "WHERE result = 'BE'"
    )
