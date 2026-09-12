from fastapi import FastAPI
from app.api import auth, backtests
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, backtests, trading_plans


app = FastAPI(title="Trading Backtesting System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(backtests.router)
app.include_router(trading_plans.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}