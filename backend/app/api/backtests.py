from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.database import get_db
from app.core.deps import get_current_trader
from app.models.trader import Trader
from app.models.backtest import Backtest
from app.models.backtest_entry import BacktestEntry
from app.schemas.backtest import (
    BacktestCreate, BacktestOut, BacktestDetail,
    BacktestEntryCreate, BacktestEntryOut,
)
from app.services.backtest_calculations import calculate_summary

router = APIRouter(prefix="/backtests", tags=["backtests"])


@router.post("", response_model=BacktestOut, status_code=status.HTTP_201_CREATED)
def create_backtest(
    data: BacktestCreate,
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    backtest = Backtest(**data.model_dump(), trader_id=current_trader.id)
    db.add(backtest)
    db.commit()
    db.refresh(backtest)
    return backtest


@router.get("", response_model=list[BacktestOut])
def list_backtests(
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    return db.query(Backtest).filter(Backtest.trader_id == current_trader.id).all()


def _get_owned_backtest(backtest_id: UUID, db: Session, current_trader: Trader) -> Backtest:
    backtest = db.query(Backtest).filter(
        Backtest.id == backtest_id, Backtest.trader_id == current_trader.id
    ).first()
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return backtest


@router.get("/{backtest_id}", response_model=BacktestDetail)
def get_backtest(
    backtest_id: UUID,
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    backtest = _get_owned_backtest(backtest_id, db, current_trader)
    summary = calculate_summary(backtest.entries)
    return BacktestDetail(
        **BacktestOut.model_validate(backtest).model_dump(),
        entries=backtest.entries,
        summary=summary,
    )


@router.post("/{backtest_id}/entries", response_model=BacktestEntryOut, status_code=status.HTTP_201_CREATED)
def add_entry(
    backtest_id: UUID,
    data: BacktestEntryCreate,
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    backtest = _get_owned_backtest(backtest_id, db, current_trader)
    entry = BacktestEntry(**data.model_dump(), backtest_id=backtest.id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry