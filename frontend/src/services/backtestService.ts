import type { Backtest, BacktestDetail } from "../types/backtest";
import api from "./api";

export async function createBacktest(data: {
  month: number;
  year: number;
  asset: string;
  lot_size: number;
  account_size: number;
  timeframe: string;
}): Promise<Backtest> {
  const response = await api.post<Backtest>("/backtests", data);
  return response.data;
}

export async function listBacktests(): Promise<Backtest[]> {
  const response = await api.get<Backtest[]>("/backtests");
  return response.data;
}

export async function getBacktestDetail(id: string): Promise<BacktestDetail> {
  const response = await api.get<BacktestDetail>(`/backtests/${id}`);
  return response.data;
}

export async function addBacktestEntry(
  backtestId: string,
  data: {
    entry_date: string;
    result: "TP" | "SL";
    percentage: number;
    amount: number;
    pips_ticks: number;
    observations?: string;
  }
) {
  const response = await api.post(`/backtests/${backtestId}/entries`, data);
  return response.data;
}