import secrets
from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_trader, hash_api_token
from app.models.api_token import ApiToken
from app.models.trader import Trader
from app.schemas.trade import ApiTokenCreate, ApiTokenCreated, ApiTokenOut

router = APIRouter(prefix="/api-tokens", tags=["api-tokens"])


@router.post("", response_model=ApiTokenCreated, status_code=status.HTTP_201_CREATED)
def create_api_token(
    data: ApiTokenCreate,
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    plain = "gml_" + secrets.token_urlsafe(32)
    api_token = ApiToken(
        trader_id=current_trader.id,
        name=data.name,
        token_hash=hash_api_token(plain),
        prefix=plain[:10],
    )
    db.add(api_token)
    db.commit()
    db.refresh(api_token)
    return ApiTokenCreated(
        id=api_token.id,
        name=api_token.name,
        prefix=api_token.prefix,
        created_at=api_token.created_at,
        last_used_at=api_token.last_used_at,
        token=plain,
    )


@router.get("", response_model=list[ApiTokenOut])
def list_api_tokens(
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    return (
        db.query(ApiToken)
        .filter(ApiToken.trader_id == current_trader.id, ApiToken.revoked_at.is_(None))
        .order_by(ApiToken.created_at.desc())
        .all()
    )


@router.delete("/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_token(
    token_id: UUID,
    db: Session = Depends(get_db),
    current_trader: Trader = Depends(get_current_trader),
):
    api_token = db.query(ApiToken).filter(
        ApiToken.id == token_id, ApiToken.trader_id == current_trader.id
    ).first()
    if not api_token:
        raise HTTPException(status_code=404, detail="Token not found")
    api_token.revoked_at = datetime.now(timezone.utc)
    db.commit()
