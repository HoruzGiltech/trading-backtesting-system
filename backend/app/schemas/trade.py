from pydantic import BaseModel, Field
from typing import Annotated, Literal, Optional
from decimal import Decimal
from uuid import UUID
from datetime import date, datetime

# --- Sincronización desde la extensión ---

class TradeSyncItem(BaseModel):
    external_id: Annotated[str, Field(min_length=1, max_length=255)]
    source: str = "fundingpips"
    account_number: Optional[str] = None
    symbol: str
    side: Literal["BUY", "SELL"]
    volume: Decimal
    open_price: Decimal
    close_price: Decimal
    closed_at: datetime
    profit: Decimal


class TradeSyncRequest(BaseModel):
    # Tamaño de cuenta usado para calcular el % de cada operación (opcional)
    account_size: Optional[Decimal] = None
    trades: Annotated[list[TradeSyncItem], Field(max_length=500)]


class TradeSyncResponse(BaseModel):
    received: int
    created: int
    skipped: int


# --- Lectura / edición desde el frontend ---

class TradeOut(BaseModel):
    id: UUID
    external_id: str
    source: str
    account_number: Optional[str] = None
    symbol: Optional[str] = None
    side: Optional[str] = None
    volume: Optional[float] = None
    open_price: Optional[float] = None
    close_price: Optional[float] = None
    closed_at: datetime
    profit: float
    pips: float
    percentage: Optional[float] = None
    result: str
    observations: Optional[str] = None

    class Config:
        from_attributes = True


class TradeUpdate(BaseModel):
    """Corrección de una operación: solo se cambian los campos enviados.
    Pips y resultado no se envían: se recalculan a partir de precios y monto."""
    symbol: Optional[Annotated[str, Field(min_length=1, max_length=20)]] = None
    side: Optional[Literal["BUY", "SELL"]] = None
    volume: Optional[Annotated[Decimal, Field(gt=0, max_digits=10, decimal_places=2)]] = None
    open_price: Optional[Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=6)]] = None
    close_price: Optional[Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=6)]] = None
    closed_at: Optional[datetime] = None
    profit: Optional[Annotated[Decimal, Field(max_digits=12, decimal_places=2)]] = None
    percentage: Optional[Annotated[Decimal, Field(max_digits=8, decimal_places=2)]] = None  # null = sin %
    observations: Optional[str] = None


class NoTradeDayCreate(BaseModel):
    date: date
    reason: Annotated[str, Field(min_length=1, max_length=500)]


class TradeSummary(BaseModel):
    total_trades: int        # no cuenta los días sin operar
    no_trade_count: int
    win_count: int
    loss_count: int
    be_count: int
    profit_amount: float
    loss_amount: float
    net_profit: float
    net_profit_pct: float
    net_pips: float
    win_rate: float
    profit_factor: Optional[float]


class TradeJournal(BaseModel):
    trades: list[TradeOut]
    summary: TradeSummary


# --- Tokens de API ---

class ApiTokenCreate(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=80)] = "Extensión Chrome"


class ApiTokenOut(BaseModel):
    id: UUID
    name: str
    prefix: str
    created_at: datetime
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApiTokenCreated(ApiTokenOut):
    token: str  # solo se devuelve al crearlo
