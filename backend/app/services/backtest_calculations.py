import statistics
from typing import List
from app.models.backtest_entry import BacktestEntry, ResultType
from app.schemas.backtest import BacktestSummary


def calculate_summary(entries: List[BacktestEntry]) -> BacktestSummary:
    # Los días sin operar no cuentan para ninguna métrica
    no_trade_count = sum(1 for e in entries if e.result == ResultType.NO_TRADE)
    entries = [e for e in entries if e.result != ResultType.NO_TRADE]
    total_days = len(entries)

    if total_days == 0:
        return BacktestSummary(
            total_days=0, no_trade_count=no_trade_count, tp_count=0, sl_count=0, be_count=0,
            profit_amount=0, loss_amount=0, net_profit=0,
            profit_amount_pct=0, loss_amount_pct=0, net_profit_pct=0,
            win_rate=0, profit_factor=None, consistency_margin=0,
        )

    tp_entries = [e for e in entries if e.result == ResultType.TP]
    sl_entries = [e for e in entries if e.result == ResultType.SL]
    be_entries = [e for e in entries if e.result == ResultType.BE]

    tp_count = len(tp_entries)
    sl_count = len(sl_entries)
    be_count = len(be_entries)

    # Los BE suman su monto real: si quedó en positivo va a beneficio, si quedó en negativo a pérdidas.
    # Así beneficio + pérdidas = neto, y el profit factor sigue siendo bruto ganado / bruto perdido.
    def gains(field: str) -> float:
        return sum(float(getattr(e, field)) for e in entries if e.result == ResultType.TP or
                   (e.result == ResultType.BE and float(getattr(e, field)) > 0))

    def losses(field: str) -> float:  # ya vienen negativos
        return sum(float(getattr(e, field)) for e in entries if e.result == ResultType.SL or
                   (e.result == ResultType.BE and float(getattr(e, field)) < 0))

    profit_amount = gains("amount")
    loss_amount = losses("amount")
    net_profit = profit_amount + loss_amount

    profit_amount_pct = gains("percentage")
    loss_amount_pct = losses("percentage")
    net_profit_pct = profit_amount_pct + loss_amount_pct

    # Igual que en el diario: el BE no cuenta como ganada ni como perdida
    decided = tp_count + sl_count
    win_rate = (tp_count / decided * 100) if decided else 0.0

    # Profit factor: beneficio / |pérdida|. Indefinido si no hubo pérdidas.
    profit_factor = (profit_amount / abs(loss_amount)) if loss_amount != 0 else None

    # Margen de consistencia: basado en coeficiente de variación de los % diarios
    daily_pcts = [float(e.percentage) for e in entries]
    mean_pct = statistics.mean(daily_pcts)
    if total_days > 1 and mean_pct != 0:
        stdev_pct = statistics.stdev(daily_pcts)
        coef_variation = abs(stdev_pct / mean_pct)
        consistency_margin = 100 / (1 + coef_variation)
    else:
        # con 1 solo día o promedio 0, no hay variación que medir de forma significativa
        consistency_margin = 100.0 if total_days == 1 else 0.0

    return BacktestSummary(
        total_days=total_days,
        no_trade_count=no_trade_count,
        tp_count=tp_count,
        sl_count=sl_count,
        be_count=be_count,
        profit_amount=round(profit_amount, 2),
        loss_amount=round(loss_amount, 2),
        net_profit=round(net_profit, 2),
        profit_amount_pct=round(profit_amount_pct, 2),
        loss_amount_pct=round(loss_amount_pct, 2),
        net_profit_pct=round(net_profit_pct, 2),
        win_rate=round(win_rate, 2),
        profit_factor=round(profit_factor, 2) if profit_factor is not None else None,
        consistency_margin=round(consistency_margin, 2),
    )