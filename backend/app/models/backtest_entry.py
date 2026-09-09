import uuid
import enum
from sqlalchemy import Column, String, Numeric, Date, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class ResultType(str, enum.Enum):
    TP = "TP"
    SL = "SL"

class BacktestEntry(Base):
    __tablename__ = "backtest_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    backtest_id = Column(UUID(as_uuid=True), ForeignKey("backtests.id"), nullable=False)
    entry_date = Column(Date, nullable=False)
    result = Column(SQLEnum(ResultType), nullable=False)
    percentage = Column(Numeric(6, 2), nullable=False)   # % ganado o perdido (con signo)
    amount = Column(Numeric(12, 2), nullable=False)       # monto en dinero (con signo)
    pips_ticks = Column(Numeric(10, 2), nullable=False)
    observations = Column(Text, nullable=True)

    backtest = relationship("Backtest", back_populates="entries")