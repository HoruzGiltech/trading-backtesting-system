from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class TradingPlanCreate(BaseModel):
    content: str

class TradingPlanOut(BaseModel):
    id: UUID
    content: str
    created_at: datetime

    class Config:
        from_attributes = True