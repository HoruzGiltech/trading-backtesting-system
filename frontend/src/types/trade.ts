export type TradeResult = "WIN" | "LOSS" | "BE";

export interface Trade {
  id: string;
  external_id: string;
  source: string;
  account_number?: string | null;
  symbol: string;
  side: "BUY" | "SELL";
  volume: number;
  open_price: number;
  close_price: number;
  closed_at: string;
  profit: number;
  pips: number;
  percentage?: number | null;
  result: TradeResult;
  observations?: string | null;
}

export interface TradeSummary {
  total_trades: number;
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
