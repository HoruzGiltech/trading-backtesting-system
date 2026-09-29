import uuid
from sqlalchemy import Column, String, Numeric, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class Trade(Base):
    """Operación real (cuenta live/demo/prop) registrada en el diario."""

    __tablename__ = "trades"
    __table_args__ = (
        # Evita duplicados cuando la extensión reenvía la misma operación
        UniqueConstraint("trader_id", "external_id", name="uq_trades_trader_external_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trader_id = Column(UUID(as_uuid=True), ForeignKey("traders.id"), nullable=False, index=True)

    external_id = Column(String, nullable=False)          # id estable generado por la fuente
    source = Column(String, nullable=False, default="manual")  # ej: "fundingpips"
    account_number = Column(String, nullable=True)        # ej: "2005196"

    symbol = Column(String, nullable=False)                # ej: "EURUSD"
    side = Column(String, nullable=False)                  # "BUY" | "SELL"
    volume = Column(Numeric(10, 2), nullable=False)        # lotes
    open_price = Column(Numeric(14, 6), nullable=False)
    close_price = Column(Numeric(14, 6), nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=False)

    profit = Column(Numeric(12, 2), nullable=False)        # con signo
    pips = Column(Numeric(10, 2), nullable=False)          # con signo
    percentage = Column(Numeric(8, 2), nullable=True)      # con signo, sobre account_size
    result = Column(String, nullable=False)                # "WIN" | "LOSS" | "BE"

    observations = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
