import type { ApiToken, ApiTokenCreated, Trade, TradeJournal } from "../types/trade";
import api from "./api";

export async function getTradeJournal(): Promise<TradeJournal> {
  const response = await api.get<TradeJournal>("/trades");
  return response.data;
}

export async function updateTradeObservations(id: string, observations: string): Promise<Trade> {
  const response = await api.patch<Trade>(`/trades/${id}`, { observations });
  return response.data;
}

export async function addNoTradeDay(date: string, reason: string): Promise<Trade> {
  const response = await api.post<Trade>("/trades/no-trade-days", { date, reason });
  return response.data;
}

export async function deleteTrade(id: string): Promise<void> {
  await api.delete(`/trades/${id}`);
}

export async function listApiTokens(): Promise<ApiToken[]> {
  const response = await api.get<ApiToken[]>("/api-tokens");
  return response.data;
}

export async function createApiToken(name: string): Promise<ApiTokenCreated> {
  const response = await api.post<ApiTokenCreated>("/api-tokens", { name });
  return response.data;
}

export async function revokeApiToken(id: string): Promise<void> {
  await api.delete(`/api-tokens/${id}`);
}

// Corrige una operación; pips y resultado los recalcula el backend
export async function updateTrade(
  id: string,
  data: Partial<Pick<Trade, "symbol" | "side" | "volume" | "open_price" | "close_price" | "closed_at" | "profit" | "percentage" | "observations">>
): Promise<Trade> {
  const response = await api.patch<Trade>(`/trades/${id}`, data);
  return response.data;
}

export async function updateNoTradeDay(id: string, date: string, reason: string): Promise<Trade> {
  const response = await api.put<Trade>(`/trades/no-trade-days/${id}`, { date, reason });
  return response.data;
}
