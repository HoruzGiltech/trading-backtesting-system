from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.trader import Trader
from app.schemas.trader import TraderCreate, TraderLogin, TraderOut, Token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TraderOut, status_code=status.HTTP_201_CREATED)
def register(trader_data: TraderCreate, db: Session = Depends(get_db)):
    existing = db.query(Trader).filter(Trader.email == trader_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    trader = Trader(
        email=trader_data.email,
        password_hash=hash_password(trader_data.password),
        full_name=trader_data.full_name,
    )
    db.add(trader)
    db.commit()
    db.refresh(trader)
    return trader

@router.post("/login", response_model=Token)
def login(credentials: TraderLogin, db: Session = Depends(get_db)):
    trader = db.query(Trader).filter(Trader.email == credentials.email).first()
    if not trader or not verify_password(credentials.password, trader.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(trader.id)})
    return Token(access_token=token)