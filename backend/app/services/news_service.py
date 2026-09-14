import time
import requests

FEED_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"
CACHE_TTL_SECONDS = 60 * 60  # 1 hora

_cache: dict = {"data": None, "fetched_at": 0.0}


def get_high_impact_news() -> list[dict]:
    now = time.time()

    if _cache["data"] is None or (now - _cache["fetched_at"]) > CACHE_TTL_SECONDS:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        all_events = response.json()
        _cache["data"] = all_events
        _cache["fetched_at"] = now

    high_impact = [event for event in _cache["data"] if event.get("impact") == "High"]
    return high_impact