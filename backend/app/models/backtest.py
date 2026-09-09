import uuid
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Backtest(Base):
    __tablename__ = "backtests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trader_id = Column(UUID(as_uuid=True), ForeignKey("traders.id"), nullable=False)
    month = Column(Integer, nullable=False)          # 1-12
    year = Column(Integer, nullable=False)
    asset = Column(String, nullable=False)            # ej: "EURUSD"
    lot_size = Column(Numeric(10, 2), nullable=False)
    account_size = Column(Numeric(12, 2), nullable=False)
    timeframe = Column(String, nullable=False)         # ej: "M15", "H1", "H4"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    entries = relationship("BacktestEntry", back_populates="backtest", cascade="all, delete-orphan")