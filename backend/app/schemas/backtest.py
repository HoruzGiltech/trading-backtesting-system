from pydantic import BaseModel, Field, model_validator
from typing import Annotated, Optional, Literal
from decimal import Decimal
from uuid import UUID
from datetime import date

# --- Backtest (cabecera) ---

class BacktestCreate(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=120)]
    month: int
    year: int
    asset: str
    lot_size: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    account_size: Annotated[Decimal, Field(max_digits=12, decimal_places=2)]
    timeframe: str

class BacktestUpdate(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=120)]

class BacktestOut(BaseModel):
    id: UUID
    name: str
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
    side: Literal["BUY", "SELL"]
    open_price: Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=6)]
    close_price: Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=6)]
    result: Literal["TP", "SL", "BE"]
    percentage: Annotated[Decimal, Field(max_digits=6, decimal_places=2)]
    amount: Annotated[Decimal, Field(max_digits=12, decimal_places=2)]
    pips_ticks: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    observations: Optional[str] = None

class NoTradeEntryCreate(BaseModel):
    entry_date: date
    reason: Annotated[str, Field(min_length=1, max_length=500)]

class BacktestEntryImport(BaseModel):
    """Fila de un CSV importado. En los CSV antiguos no hay lado ni precios, por eso son opcionales."""
    entry_date: date
    result: Literal["TP", "SL", "BE", "NO_TRADE"]
    side: Optional[Literal["BUY", "SELL"]] = None
    open_price: Optional[Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=6)]] = None
    close_price: Optional[Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=6)]] = None
    percentage: Annotated[Decimal, Field(max_digits=6, decimal_places=2)] = Decimal(0)
    amount: Annotated[Decimal, Field(max_digits=12, decimal_places=2)] = Decimal(0)
    pips_ticks: Annotated[Decimal, Field(max_digits=10, decimal_places=2)] = Decimal(0)
    observations: Optional[str] = None

    @model_validator(mode="after")
    def no_trade_has_reason(self):
        if self.result == "NO_TRADE" and not (self.observations or "").strip():
            raise ValueError("Los días sin operar necesitan un motivo en observaciones")
        return self

class BacktestImport(BaseModel):
    entries: Annotated[list[BacktestEntryImport], Field(min_length=1, max_length=1000)]

class BacktestImportResult(BaseModel):
    imported: int
    skipped: int             # días sin operar que ya estaban registrados

class BacktestEntryOut(BaseModel):
    id: UUID
    entry_date: date
    side: Optional[str] = None
    open_price: Optional[float] = None
    close_price: Optional[float] = None
    result: str
    percentage: float
    amount: float
    pips_ticks: float
    observations: Optional[str] = None

    class Config:
        from_attributes = True

# --- Resumen calculado ---

class BacktestSummary(BaseModel):
    total_days: int          # días operados (no cuenta los días sin operar)
    no_trade_count: int
    tp_count: int
    sl_count: int
    be_count: int
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