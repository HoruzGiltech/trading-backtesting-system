export type TradeResult = "WIN" | "LOSS" | "BE" | "NO_TRADE";

export interface Trade {
  id: string;
  external_id: string;
  source: string;
  account_number?: string | null;
  // null en las filas de "día sin operar" (result = "NO_TRADE")
  symbol: string | null;
  side: "BUY" | "SELL" | null;
  volume: number | null;
  open_price: number | null;
  close_price: number | null;
  closed_at: string;
  profit: number;
  pips: number;
  percentage?: number | null;
  result: TradeResult;
  observations?: string | null;
}

export interface TradeSummary {
  total_trades: number;
  no_trade_count: number;
  win_count: number;
  loss_count: number;
  be_count: number;
  profit_amount: number;
  loss_amount: number;
  net_profit: number;
  net_profit_pct: number;
  net_pips: number;
  win_rate: number;
  profit_factor: number | null;
}

export interface TradeJournal {
  trades: Trade[];
  summary: TradeSummary;
}

export interface ApiToken {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at?: string | null;
}

export interface ApiTokenCreated extends ApiToken {
  token: string;
}
