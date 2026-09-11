from pydantic import BaseModel, Field
from typing import Annotated, Optional, Literal
from decimal import Decimal
from uuid import UUID
from datetime import date

# --- Backtest (cabecera) ---

class BacktestCreate(BaseModel):
    month: int
    year: int
    asset: str
    lot_size: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    account_size: Annotated[Decimal, Field(max_digits=12, decimal_places=2)]
    timeframe: str

class BacktestOut(BaseModel):
    id: UUID
    month: int
    year: int
    asset: str
    lot_size: float
    account_size: float
    timeframe: str

    class Config:
        from_attributes = True

# --- Backtest entry (fila diaria) ---

class BacktestEntryCreate(BaseModel):
    entry_date: date
    result: Literal["TP", "SL"]
    percentage: Annotated[Decimal, Field(max_digits=6, decimal_places=2)]
    amount: Annotated[Decimal, Field(max_digits=12, decimal_places=2)]
    pips_ticks: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    observations: Optional[str] = None

class BacktestEntryOut(BaseModel):
    id: UUID
    entry_date: date
    result: str
    percentage: float
    amount: float
    pips_ticks: float
    observations: Optional[str] = None

    class Config:
        from_attributes = True

# --- Resumen calculado ---

class BacktestSummary(BaseModel):
    total_days: int
    tp_count: int
    sl_count: int
    profit_amount: float
    loss_amount: float
    net_profit: float
    profit_amount_pct: float
    loss_amount_pct: float
    net_profit_pct: float
    win_rate: float
    profit_factor: Optional[float]
    consistency_margin: float

class BacktestDetail(BacktestOut):
    entries: list[BacktestEntryOut]
    summary: BacktestSummary