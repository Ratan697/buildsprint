from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from app.parsers.sql_parser import compare_schemas
from app.analysis.blast_radius import DependencyGraph

router = APIRouter(prefix="/analysis", tags=["Analysis"])

class SimulationRequest(BaseModel):
    target_component: str = Field(..., description="The database or service component being altered")
    v1_sql: Optional[str] = Field(None, description="Original SQL schema statement")
    v2_sql: Optional[str] = Field(None, description="Updated SQL schema statement")
    graph_data: Optional[Dict[str, Any]] = Field(None, description="Graph nodes and edges for dependency traversal")

@router.post("/simulate")
def simulate_schema_impact(payload: SimulationRequest):
    """
    Simulates a schema change and calculates the downstream blast radius and risk scores.
    """
    try:
        # 1. Parse and compare schemas if provided
        schema_diff = {}
        if payload.v1_sql and payload.v2_sql:
            schema_diff = compare_schemas(payload.v1_sql, payload.v2_sql, dialect="postgres", as_json=False)
        
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
            reverse_direction=True
        )
        
        return {
            "status": "success",
            "schema_modifications": schema_diff,
            "blast_radius_analysis": analysis_report
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))