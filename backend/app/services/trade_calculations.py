from decimal import Decimal
from typing import List, Optional
from app.models.trade import Trade
from app.schemas.trade import TradeSummary


def pip_size(symbol: str) -> Decimal:
    """Tamaño de pip aproximado según el símbolo."""
    s = symbol.upper()
    if "JPY" in s:
        return Decimal("0.01")
    if s.startswith("XAU"):
        return Decimal("0.1")
    if s.startswith("XAG"):
        return Decimal("0.01")
    return Decimal("0.0001")


def calculate_pips(symbol: str, side: str, open_price: Decimal, close_price: Decimal) -> Decimal:
    diff = (close_price - open_price) if side == "BUY" else (open_price - close_price)
    return (diff / pip_size(symbol)).quantize(Decimal("0.01"))


def classify_result(profit: Decimal) -> str:
    if profit > 0:
        return "WIN"
    if profit < 0:
        return "LOSS"
    return "BE"


def calculate_percentage(profit: Decimal, account_size: Optional[Decimal]) -> Optional[Decimal]:
    if not account_size or account_size <= 0:
        return None
    return (profit / account_size * 100).quantize(Decimal("0.01"))


def calculate_trade_summary(trades: List[Trade]) -> TradeSummary:
    total = len(trades)
    wins = [t for t in trades if t.result == "WIN"]
    losses = [t for t in trades if t.result == "LOSS"]
    be = [t for t in trades if t.result == "BE"]

    profit_amount = sum(float(t.profit) for t in wins)
    loss_amount = sum(float(t.profit) for t in losses)  # negativo
    net_profit = profit_amount + loss_amount
    net_profit_pct = sum(float(t.percentage) for t in trades if t.percentage is not None)
    net_pips = sum(float(t.pips) for t in trades)

    decided = len(wins) + len(losses)
    win_rate = (len(wins) / decided * 100) if decided else 0.0
    profit_factor = (profit_amount / abs(loss_amount)) if loss_amount != 0 else None

    return TradeSummary(
        total_trades=total,
        win_count=len(wins),
        loss_count=len(losses),
        be_count=len(be),
        profit_amount=round(profit_amount, 2),
        loss_amount=round(loss_amount, 2),
        net_profit=round(net_profit, 2),
        net_profit_pct=round(net_profit_pct, 2),
        net_pips=round(net_pips, 2),
        win_rate=round(win_rate, 2),
        profit_factor=round(profit_factor, 2) if profit_factor is not None else None,
    )
