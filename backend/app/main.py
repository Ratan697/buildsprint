"""
backend/app/main.py

FastAPI entrypoint, CORS middleware, route mounting, and startup seed triggers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.routes.analysis import router as analysis_router
from app.routes.ingest import router as ingest_router
from app.routes.auth import router as auth_router
from app.routes.dependencies import router as dependencies_router
from app.routes.risk_rules import router as risk_rules_router
from app.routes.reports import router as reports_router
from app.routes.settings import router as settings_router

# Create database tables automatically on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ChangeShield API",
    description="Production-grade schema change simulation, blast radius impact analysis, system topology ingestion, and risk governance API",
    version="2.4.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all feature routers
app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(ingest_router)
app.include_router(dependencies_router)
app.include_router(risk_rules_router)
app.include_router(reports_router)
app.include_router(settings_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to ChangeShield API",
        "docs": "/docs",
        "version": "2.4.0"
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "ChangeShield Engine",
        "version": "2.4.0"
    }
