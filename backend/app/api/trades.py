from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_trader, get_trader_from_api_token
from app.models.trade import Trade
from app.models.trader import Trader
from app.schemas.trade import (
    TradeJournal, TradeOut, TradeSyncRequest, TradeSyncResponse, TradeUpdate,
)
from app.services.trade_calculations import (
    calculate_percentage, calculate_pips, calculate_trade_summary, classify_result,
)

router = APIRouter(prefix="/trades", tags=["trades"])


@router.post("/sync", response_model=TradeSyncResponse)
def sync_trades(
    data: TradeSyncRequest,
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_trader_from_api_token),
):
    """Recibe operaciones cerradas desde la extensión. Ignora las que ya existen."""
    incoming_ids = {item.external_id for item in data.trades}
    existing_ids = {
        row[0]
        for row in db.query(Trade.external_id)
        .filter(Trade.trader_id == current_trader.id, Trade.external_id.in_(incoming_ids))
        .all()
    } if incoming_ids else set()

    created = 0
    seen: set[str] = set()
    for item in data.trades:
        if item.external_id in existing_ids or item.external_id in seen:
            continue
        seen.add(item.external_id)
        db.add(Trade(
            trader_id=current_trader.id,
            external_id=item.external_id,
            source=item.source,
            account_number=item.account_number,
            symbol=item.symbol.upper(),
            side=item.side,
            volume=item.volume,
            open_price=item.open_price,
            close_price=item.close_price,
            closed_at=item.closed_at,
            profit=item.profit,
            pips=calculate_pips(item.symbol, item.side, item.open_price, item.close_price),
            percentage=calculate_percentage(item.profit, data.account_size),
            result=classify_result(item.profit),
        ))
        created += 1

    db.commit()
    return TradeSyncResponse(received=len(data.trades), created=created, skipped=len(data.trades) - created)


@router.get("", response_model=TradeJournal)
def list_trades(
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    trades = (
        db.query(Trade)
        .filter(Trade.trader_id == current_trader.id)
        .order_by(Trade.closed_at.desc())
        .all()
    )
    return TradeJournal(trades=trades, summary=calculate_trade_summary(trades))


def _get_owned_trade(trade_id: UUID, db: Session, current_trader: Trader) -> Trade:
    trade = db.query(Trade).filter(Trade.id == trade_id, Trade.trader_id == current_trader.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade


@router.patch("/{trade_id}", response_model=TradeOut)
def update_trade(
    trade_id: UUID,
    data: TradeUpdate,
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    trade = _get_owned_trade(trade_id, db, current_trader)
    trade.observations = data.observations
    db.commit()
    db.refresh(trade)
    return trade


@router.delete("/{trade_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trade(
    trade_id: UUID,
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    trade = _get_owned_trade(trade_id, db, current_trader)
    db.delete(trade)
    db.commit()
