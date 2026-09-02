from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.expenses import router as expenses_router
from app.api.ai import router as ai_router


app = FastAPI(
    title="AI Expense Tracker"
)


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# ROUTERS
# =========================

app.include_router(expenses_router)
app.include_router(ai_router)


# =========================
# HOME
# =========================

@app.get("/")
def home():
    return {
        "message": "AI Expense Tracker API is running"
    }