"""
backend/app/main.py

FastAPI entrypoint, CORS middleware, route mounting, and startup seed triggers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base, SessionLocal
from app.db.models import WorkspaceSettingsModel, SystemModel, RiskRuleModel, AuditReportModel
from app.routes.analysis import router as analysis_router
from app.routes.ingest import router as ingest_router
from app.routes.auth import router as auth_router
from app.routes.dependencies import router as dependencies_router
from app.routes.risk_rules import router as risk_rules_router
from app.routes.reports import router as reports_router
from app.routes.settings import router as settings_router

# Create database tables automatically on startup
Base.metadata.create_all(bind=engine)


def seed_default_data():
    """Seeds default database entries if empty on startup."""
    db = SessionLocal()
    try:
        ws = db.query(WorkspaceSettingsModel).filter(WorkspaceSettingsModel.id == "default").first()
        if not ws:
            db.add(WorkspaceSettingsModel(id="default"))

        if db.query(SystemModel).count() == 0:
            default_sys = SystemModel(
                id="sys-ecom-core",
                name="E-Commerce Core Platform",
                source_type="github",
                source_label="GitHub App (org/ecom-core)",
                repo_url="https://github.com/org/ecom-core",
                branch="main",
                last_commit_sha="9b8c2f1",
                last_commit_message="feat(orders): update customer_id index & schema relations",
                status="Healthy",
                stats_json='{"services": 8, "apis": 12, "databases": 4, "externalIntegrations": 2}',
                graph_json='{"services": [{"id": "db-users", "criticality": 5.0, "type": "database"}, {"id": "user-service", "criticality": 4.8, "type": "backend"}], "edges": [{"source": "user-service", "target": "db-users", "relation": "reads_writes"}]}',
                components_json='{"services": [{"name": "user-service", "criticality": 4.8, "type": "backend"}], "endpoints": [{"method": "POST", "path": "/v1/users/register", "consumers": 4}], "tables": [{"name": "users", "columnsCount": 14}]}'
            )
            db.add(default_sys)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding default data: {e}")
    finally:
        db.close()


seed_default_data()

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
