"""add name to backtests

Revision ID: d1a6b4c5e7f8
Revises: c9f5a3b4d6e7
Create Date: 2026-10-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1a6b4c5e7f8'
down_revision: Union[str, Sequence[str], None] = 'c9f5a3b4d6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('backtests', sa.Column('name', sa.String(), nullable=True))
    # Los backtests existentes reciben un nombre por defecto: "EURUSD 7/2026 M15"
    op.execute(
        "UPDATE backtests SET name = asset || ' ' || month || '/' || year || ' ' || timeframe"
    )
    op.alter_column('backtests', 'name', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('backtests', 'name')
