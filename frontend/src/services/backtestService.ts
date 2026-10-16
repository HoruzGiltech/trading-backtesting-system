import type { Backtest, BacktestDetail, BacktestImportResult, BacktestImportRow } from "../types/backtest";
import api from "./api";

export async function createBacktest(data: {
  name: string;
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
    side: "BUY" | "SELL";
    open_price: number;
    close_price: number;
    result: "TP" | "SL" | "BE";
    percentage: number;
    amount: number;
    pips_ticks: number;
    observations?: string;
  }
) {
  const response = await api.post(`/backtests/${backtestId}/entries`, data);
  return response.data;
}

export async function addNoTradeDay(backtestId: string, entryDate: string, reason: string) {
  const response = await api.post(`/backtests/${backtestId}/no-trade-days`, {
    entry_date: entryDate,
    reason,
  });
  return response.data;
}

export async function importBacktestEntries(
  backtestId: string,
  entries: BacktestImportRow[]
): Promise<BacktestImportResult> {
  const response = await api.post<BacktestImportResult>(`/backtests/${backtestId}/import`, { entries });
  return response.data;
}

export async function updateBacktest(id: string, data: { name: string }): Promise<Backtest> {
  const response = await api.patch<Backtest>(`/backtests/${id}`, data);
  return response.data;
}

export async function deleteBacktest(id: string): Promise<void> {
  await api.delete(`/backtests/${id}`);
}

export async function updateBacktestEntry(
  backtestId: string,
  entryId: string,
  data: Parameters<typeof addBacktestEntry>[1]
) {
  const response = await api.put(`/backtests/${backtestId}/entries/${entryId}`, data);
  return response.data;
}

export async function updateNoTradeDay(backtestId: string, entryId: string, entryDate: string, reason: string) {
  const response = await api.put(`/backtests/${backtestId}/no-trade-days/${entryId}`, {
    entry_date: entryDate,
    reason,
  });
  return response.data;
}

export async function deleteBacktestEntry(backtestId: string, entryId: string): Promise<void> {
  await api.delete(`/backtests/${backtestId}/entries/${entryId}`);
}
