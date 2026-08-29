from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.analysis import router as analysis_router

app = FastAPI(
    title="ChangeShield API",
    description="Schema change simulation and blast radius impact analysis service",
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

# Mount the analysis router
app.include_router(analysis_router)

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
    