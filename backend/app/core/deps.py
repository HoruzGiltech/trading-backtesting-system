from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError
from uuid import UUID
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.trader import Trader

security_scheme = HTTPBearer()

def get_current_trader(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Trader:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        trader_id = UUID(payload.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    trader = db.query(Trader).filter(Trader.id == trader_id).first()
    if not trader:
        raise HTTPException(status_code=401, detail="Trader not found")
    return trader