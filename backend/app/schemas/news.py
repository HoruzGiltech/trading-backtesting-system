from pydantic import BaseModel
from typing import Optional

class NewsEvent(BaseModel):
    title: str
    country: str
    date: str
    impact: str
    forecast: Optional[str] = None
    previous: Optional[str] = None