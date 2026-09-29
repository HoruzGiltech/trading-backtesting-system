import hashlib
from datetime import datetime, timezone
from fastapi import Depends, Header, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError
from uuid import UUID
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.api_token import ApiToken
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

# --- Autenticación por token de API (integraciones como la extensión de Chrome) ---


def hash_api_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_trader_from_api_token(
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> Trader:
    api_token = (
        db.query(ApiToken)
        .filter(ApiToken.token_hash == hash_api_token(x_api_key), ApiToken.revoked_at.is_(None))
        .first()
    )
    if not api_token:
        raise HTTPException(status_code=401, detail="Invalid or revoked API token")

    trader = db.query(Trader).filter(Trader.id == api_token.trader_id).first()
    if not trader:
        raise HTTPException(status_code=401, detail="Trader not found")

    api_token.last_used_at = datetime.now(timezone.utc)
    db.commit()
    return trader
