from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.routes.analysis import router as analysis_router
from app.routes.ingest import router as ingest_router

# Create database tables automatically on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ChangeShield API",
    description="Schema change simulation, blast radius impact analysis, and system topology ingestion API",
    version="1.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the routers
app.include_router(analysis_router)
app.include_router(ingest_router)

@app.get("/", tags=["Root"])
def root():
    return {"message": "Welcome to ChangeShield API", "docs": "/docs"}

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
