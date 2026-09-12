from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_trader
from app.models.trader import Trader
from app.models.trading_plan import TradingPlan
from app.schemas.trading_plan import TradingPlanCreate, TradingPlanOut

router = APIRouter(prefix="/trading-plans", tags=["trading-plans"])


@router.post("", response_model=TradingPlanOut, status_code=status.HTTP_201_CREATED)
def create_trading_plan(
    data: TradingPlanCreate,
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    plan = TradingPlan(content=data.content, trader_id=current_trader.id)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("", response_model=list[TradingPlanOut])
def list_trading_plans(
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    return (
        db.query(TradingPlan)
        .filter(TradingPlan.trader_id == current_trader.id)
        .order_by(TradingPlan.created_at.desc())
        .all()
    )