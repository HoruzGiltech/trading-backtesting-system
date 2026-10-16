from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.database import get_db
from app.core.deps import get_current_trader
from app.models.trader import Trader
from app.models.backtest import Backtest
from app.models.backtest_entry import BacktestEntry, ResultType
from app.schemas.backtest import (
    BacktestCreate, BacktestOut, BacktestDetail,
    BacktestEntryCreate, BacktestEntryOut, NoTradeEntryCreate,
    BacktestImport, BacktestImportResult, BacktestUpdate,
)
from app.services.backtest_calculations import calculate_summary

router = APIRouter(prefix="/backtests", tags=["backtests"])


@router.post("", response_model=BacktestOut, status_code=status.HTTP_201_CREATED)
def create_backtest(
    data: BacktestCreate,
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    backtest = Backtest(**data.model_dump(exclude={"name"}), name=data.name.strip(), trader_id=current_trader.id)
    db.add(backtest)
    db.commit()
    db.refresh(backtest)
    return backtest


@router.get("", response_model=list[BacktestOut])
def list_backtests(
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    return (
        db.query(Backtest)
        .filter(Backtest.trader_id == current_trader.id)
        .order_by(Backtest.created_at.desc())
        .all()
    )


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


@router.post("/{backtest_id}/no-trade-days", response_model=BacktestEntryOut, status_code=status.HTTP_201_CREATED)
def add_no_trade_day(
    backtest_id: UUID,
    data: NoTradeEntryCreate,
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    """Registra un día en el que no se operó, con su motivo."""
    backtest = _get_owned_backtest(backtest_id, db, current_trader)
    already = db.query(BacktestEntry).filter(
        BacktestEntry.backtest_id == backtest.id,
        BacktestEntry.entry_date == data.entry_date,
        BacktestEntry.result == ResultType.NO_TRADE,
    ).first()
    if already:
        raise HTTPException(status_code=409, detail="Ese día ya está registrado como no operado")
    entry = BacktestEntry(
        backtest_id=backtest.id,
        entry_date=data.entry_date,
        result=ResultType.NO_TRADE,
        percentage=0, amount=0, pips_ticks=0,
        observations=data.reason.strip(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/{backtest_id}/import", response_model=BacktestImportResult, status_code=status.HTTP_201_CREATED)
def import_entries(
    backtest_id: UUID,
    data: BacktestImport,
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    """Registra de una vez las filas de un CSV. Todo o nada: si una fila es inválida no se guarda ninguna."""
    backtest = _get_owned_backtest(backtest_id, db, current_trader)
    no_trade_dates = {
        d for (d,) in db.query(BacktestEntry.entry_date).filter(
            BacktestEntry.backtest_id == backtest.id,
            BacktestEntry.result == ResultType.NO_TRADE,
        )
    }
    imported = skipped = 0
    for row in data.entries:
        if row.result == "NO_TRADE":
            if row.entry_date in no_trade_dates:
                skipped += 1
                continue
            no_trade_dates.add(row.entry_date)
            entry = BacktestEntry(
                backtest_id=backtest.id,
                entry_date=row.entry_date,
                result=ResultType.NO_TRADE,
                percentage=0, amount=0, pips_ticks=0,
                observations=row.observations.strip(),
            )
        else:
            # En TP/SL el signo lo decide el resultado, como en el formulario manual;
            # en BE se respeta el del archivo (pequeño +/- por spread o comisión)
            def signed(value):
                if row.result == "BE":
                    return value
                return abs(value) if row.result == "TP" else -abs(value)

            entry = BacktestEntry(
                backtest_id=backtest.id,
                entry_date=row.entry_date,
                side=row.side,
                open_price=row.open_price,
                close_price=row.close_price,
                result=ResultType(row.result),
                percentage=signed(row.percentage),
                amount=signed(row.amount),
                pips_ticks=signed(row.pips_ticks),
                observations=(row.observations or "").strip() or None,
            )
        db.add(entry)
        imported += 1
    db.commit()
    return BacktestImportResult(imported=imported, skipped=skipped)


@router.patch("/{backtest_id}", response_model=BacktestOut)
def update_backtest(
    backtest_id: UUID,
    data: BacktestUpdate,
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    """Cambia el nombre identificativo del backtest."""
    backtest = _get_owned_backtest(backtest_id, db, current_trader)
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="El nombre no puede estar vacío")
    backtest.name = name
    db.commit()
    db.refresh(backtest)
    return backtest
