"""
backend/app/routes/analysis.py

APIRouter for schema diffing, blast radius impact simulation, and persistent simulation history.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import SimulationModel
from app.parsers.sql_parser import compare_schemas
from app.analysis.blast_radius import DependencyGraph

router = APIRouter(prefix="/analysis", tags=["Analysis"])


class SimulationRequest(BaseModel):
    name: Optional[str] = Field("Schema Migration Simulation", description="Simulation run name")
    target_component: str = Field(..., description="The database or service component being altered")
    v1_sql: Optional[str] = Field(None, description="Original SQL schema statement")
    v2_sql: Optional[str] = Field(None, description="Updated SQL schema statement")
    v1_schema: Optional[str] = Field(None, description="Alias for original SQL schema")
    v2_schema: Optional[str] = Field(None, description="Alias for updated SQL schema")
    dialect: Optional[str] = Field("postgres", description="SQL dialect for sqlglot parser")
    graph_data: Optional[Dict[str, Any]] = Field(None, description="Graph nodes and edges for dependency traversal")
    max_depth: Optional[int] = Field(None, description="Optional maximum depth cutoff")


class SimulationResponse(BaseModel):
    simulation_id: str
    name: str
    target_component: str
    risk_score: float
    risk_level: str
    schema_modifications: Dict[str, Any]
    blast_radius_analysis: Dict[str, Any]
    status: str = "success"


def determine_risk_level(score: float) -> str:
    """
    Classifies numeric risk score into 'Low', 'Medium', or 'High' risk levels.
    """
    if score >= 10.0:
        return "High"
    elif score >= 5.0:
        return "Medium"
    return "Low"


@router.post(
    "/simulate",
    status_code=status.HTTP_200_OK,
    summary="Simulate Schema Change Blast Radius",
    description="Parses SQL schema changes, computes downstream impact, and saves run record to database."
)
def simulate_schema_impact(
    payload: SimulationRequest,
    db: Session = Depends(get_db)
):
    try:
        sql_v1 = payload.v1_sql or payload.v1_schema
        sql_v2 = payload.v2_sql or payload.v2_schema

        # 1. Parse and compare SQL schemas if provided
        schema_diff = {}
        if sql_v1 and sql_v2:
            try:
                schema_diff = compare_schemas(
                    v1_sql=sql_v1,
                    v2_sql=sql_v2,
                    dialect=payload.dialect or "postgres",
                    as_json=False
                )
            except Exception as e:
                schema_diff = {"error": f"Schema diff error: {str(e)}"}

        # 2. Run blast radius dependency analysis
        default_graph = {
            "services": [
                {"id": "db-users", "criticality": 5.0, "type": "database"},
                {"id": "user-service", "criticality": 4.0, "type": "backend"},
                {"id": "auth-service", "criticality": 5.0, "type": "backend"},
                {"id": "api-gateway", "criticality": 3.0, "type": "gateway"}
            ],
            "edges": [
                {"source": "user-service", "target": "db-users", "relation": "reads_writes"},
                {"source": "auth-service", "target": "user-service", "relation": "depends_on"},
                {"source": "api-gateway", "target": "auth-service", "relation": "calls"}
            ]
        }

        graph_input = payload.graph_data if payload.graph_data else default_graph
        analyzer = DependencyGraph(graph_input)

        analysis_report = analyzer.analyze_blast_radius(
            start_node=payload.target_component,
            reverse_direction=True,
            max_depth=payload.max_depth
        )

        simulation_id = str(uuid.uuid4())
        risk_score = float(analysis_report.get("risk_score", 1.0))
        risk_level = determine_risk_level(risk_score)
        sim_name = payload.name or f"Simulate {payload.target_component}"

        # 3. Save simulation record in SQLite database
        sim_record = SimulationModel(
            id=simulation_id,
            name=sim_name,
            target_component=payload.target_component,
            category="Schema Change",
            risk_score=risk_score,
            risk_level=risk_level,
            v1_sql=sql_v1 or "",
            v2_sql=sql_v2 or "",
            result_json=json.dumps({
                "schema_modifications": schema_diff,
                "blast_radius_analysis": analysis_report
            }),
            created_at=datetime.now(timezone.utc)
        )

        db.add(sim_record)
        db.commit()

        return {
            "status": "success",
            "simulation_id": simulation_id,
            "name": sim_name,
            "target_component": payload.target_component,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "schema_modifications": schema_diff,
            "blast_radius_analysis": analysis_report
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/simulations",
    status_code=status.HTTP_200_OK,
    summary="List Simulation History",
    description="Returns list of past simulation runs with summary metrics."
)
def list_simulations(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    sims = db.query(SimulationModel).order_by(SimulationModel.created_at.desc()).all()
    return [
        {
            "id": sim.id,
            "name": sim.name,
            "target_component": sim.target_component,
            "category": sim.category,
            "risk_score": sim.risk_score,
            "risk_level": sim.risk_level,
            "created_at": (sim.created_at.replace(tzinfo=timezone.utc) if sim.created_at.tzinfo is None else sim.created_at).isoformat() if sim.created_at else None
        }
        for sim in sims
    ]


@router.get(
    "/simulations/{simulation_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Specific Simulation Report",
    description="Retrieves complete simulation report and SQL diff by simulation ID."
)
def get_simulation(simulation_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    sim = db.query(SimulationModel).filter(SimulationModel.id == simulation_id).first()
    if not sim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation run with ID '{simulation_id}' not found."
        )

    return {
        "id": sim.id,
        "name": sim.name,
        "target_component": sim.target_component,
        "category": sim.category,
        "risk_score": sim.risk_score,
        "risk_level": sim.risk_level,
        "v1_sql": sim.v1_sql,
        "v2_sql": sim.v2_sql,
        "results": json.loads(sim.result_json),
        "created_at": sim.created_at.isoformat() if sim.created_at else None
    }