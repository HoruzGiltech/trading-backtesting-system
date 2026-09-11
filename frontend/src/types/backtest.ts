export interface Backtest {
  id: string;
  month: number;
  year: number;
  asset: string;
  lot_size: number;
  account_size: number;
  timeframe: string;
}

export type ResultType = "TP" | "SL";

export interface BacktestEntry {
  id: string;
  entry_date: string;
  result: ResultType;
  percentage: number;
  amount: number;
  pips_ticks: number;
  observations?: string;
}

export interface BacktestSummary {
  total_days: number;
  tp_count: number;
  sl_count: number;
  profit_amount: number;
  loss_amount: number;
  net_profit: number;
  profit_amount_pct: number;
  loss_amount_pct: number;
  net_profit_pct: number;
  win_rate: number;
  profit_factor: number | null;
  consistency_margin: number;
}

export interface BacktestDetail extends Backtest {
  entries: BacktestEntry[];
  summary: BacktestSummary;
}