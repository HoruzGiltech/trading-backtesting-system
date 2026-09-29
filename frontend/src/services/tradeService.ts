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
