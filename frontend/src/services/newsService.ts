import type { NewsEvent } from "../types/news";
import api from "./api";

export async function getHighImpactNews(): Promise<NewsEvent[]> {
  const response = await api.get<NewsEvent[]>("/news/high-impact");
  return response.data;
}