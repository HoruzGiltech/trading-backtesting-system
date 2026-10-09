"""add side and prices to backtest entries

Revision ID: c9f5a3b4d6e7
Revises: b8e4f2a3c5d6
Create Date: 2026-10-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9f5a3b4d6e7'
down_revision: Union[str, Sequence[str], None] = 'b8e4f2a3c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('backtest_entries', sa.Column('side', sa.String(), nullable=True))
    op.add_column('backtest_entries', sa.Column('open_price', sa.Numeric(precision=14, scale=6), nullable=True))
    op.add_column('backtest_entries', sa.Column('close_price', sa.Numeric(precision=14, scale=6), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('backtest_entries', 'close_price')
    op.drop_column('backtest_entries', 'open_price')
    op.drop_column('backtest_entries', 'side')
