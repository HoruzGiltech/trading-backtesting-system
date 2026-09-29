"""add trades and api_tokens tables

Revision ID: a7d3e1f2b4c5
Revises: 9b839b35149e
Create Date: 2026-09-29 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7d3e1f2b4c5'
down_revision: Union[str, Sequence[str], None] = '9b839b35149e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('api_tokens',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('trader_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('token_hash', sa.String(), nullable=False),
    sa.Column('prefix', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['trader_id'], ['traders.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_api_tokens_trader_id'), 'api_tokens', ['trader_id'], unique=False)
    op.create_index(op.f('ix_api_tokens_token_hash'), 'api_tokens', ['token_hash'], unique=True)

    op.create_table('trades',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('trader_id', sa.UUID(), nullable=False),
    sa.Column('external_id', sa.String(), nullable=False),
    sa.Column('source', sa.String(), nullable=False),
    sa.Column('account_number', sa.String(), nullable=True),
    sa.Column('symbol', sa.String(), nullable=False),
    sa.Column('side', sa.String(), nullable=False),
    sa.Column('volume', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('open_price', sa.Numeric(precision=14, scale=6), nullable=False),
    sa.Column('close_price', sa.Numeric(precision=14, scale=6), nullable=False),
    sa.Column('closed_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('profit', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('pips', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('percentage', sa.Numeric(precision=8, scale=2), nullable=True),
    sa.Column('result', sa.String(), nullable=False),
    sa.Column('observations', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['trader_id'], ['traders.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('trader_id', 'external_id', name='uq_trades_trader_external_id')
    )
    op.create_index(op.f('ix_trades_trader_id'), 'trades', ['trader_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_trades_trader_id'), table_name='trades')
    op.drop_table('trades')
    op.drop_index(op.f('ix_api_tokens_token_hash'), table_name='api_tokens')
    op.drop_index(op.f('ix_api_tokens_trader_id'), table_name='api_tokens')
    op.drop_table('api_tokens')
