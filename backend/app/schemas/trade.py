from pydantic import BaseModel, Field
from typing import Annotated, Literal, Optional
from decimal import Decimal
from uuid import UUID
from datetime import datetime

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
    symbol: str
    side: str
    volume: float
    open_price: float
    close_price: float
    closed_at: datetime
    profit: float
    pips: float
    percentage: Optional[float] = None
    result: str
    observations: Optional[str] = None

    class Config:
        from_attributes = True


class TradeUpdate(BaseModel):
    observations: Optional[str] = None


class TradeSummary(BaseModel):
    total_trades: int
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
