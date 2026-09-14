from fastapi import APIRouter, Depends, HTTPException
from app.core.deps import get_current_trader
from app.models.trader import Trader
from app.schemas.news import NewsEvent
from app.services.news_service import get_high_impact_news

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/high-impact", response_model=list[NewsEvent])
def high_impact_news(current_trader: Trader = Depends(get_current_trader)):
    try:
        return get_high_impact_news()
    except Exception:
        raise HTTPException(status_code=502, detail="No se pudo obtener el calendario de noticias en este momento")