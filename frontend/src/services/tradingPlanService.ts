import type { TradingPlan } from "../types/tradingPlan";
import api from "./api";

export async function createTradingPlan(content: string): Promise<TradingPlan> {
  const response = await api.post<TradingPlan>("/trading-plans", { content });
  return response.data;
}

export async function listTradingPlans(): Promise<TradingPlan[]> {
  const response = await api.get<TradingPlan[]>("/trading-plans");
  return response.data;
}