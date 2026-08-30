"""
backend/app/routes/analysis.py

Simulation execution, diff comparison, run history, and blast radius routes.
"""

import json
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import SimulationModel
from app.parsers.sql_parser import SQLParser
from app.analysis.blast_radius import BlastRadiusAnalyzer
from app.analysis.risk_engine import RiskEngine

router = APIRouter(prefix="/analysis", tags=["Analysis & Simulation"])


class SimulationRequest(BaseModel):
    target_component: str
    name: Optional[str] = None
    v1_sql: Optional[str] = "CREATE TABLE users (customer_id INT PRIMARY KEY);"
    v2_sql: Optional[str] = "CREATE TABLE users (customer_id UUID PRIMARY KEY);"
    graph_data: Optional[Dict[str, Any]] = None


class CompareRequest(BaseModel):
    simulation_id_a: str
    simulation_id_b: str


@router.post("/simulate")
def simulate_change(payload: SimulationRequest, db: Session = Depends(get_db)):
    """
    Executes schema diff, blast radius traversal, and risk evaluation.
    """
    target = payload.target_component.strip() or "db-users"
    v1 = payload.v1_sql or "CREATE TABLE users (customer_id INT PRIMARY KEY);"
    v2 = payload.v2_sql or "CREATE TABLE users (customer_id UUID PRIMARY KEY);"

    # 1. Compare SQL DDL schemas
    diff = SQLParser.compare_schemas(v1, v2)

    # 2. Execute graph traversal
    analyzer = BlastRadiusAnalyzer(payload.graph_data)
    blast_res = analyzer.analyze(start_node=target, max_depth=4)

    # 3. Calculate Risk Score
    risk_res = RiskEngine.calculate_score(
        depth=blast_res["max_depth_reached"],
        affected_nodes_count=blast_res["impacted_count"],
        external_exposure="gateway" in target or "stripe" in target or "external" in target,
        target_criticality=5.0 if "db-" in target or "users" in target else 4.0,
        is_breaking_change=diff["is_breaking"]
    )

    # 4. Evaluate Policy Violations
    violations = RiskEngine.evaluate_policy_rules(
        risk_score=risk_res["risk_score"],
        start_node=target,
        is_breaking=diff["is_breaking"],
        impacted_count=blast_res["impacted_count"]
    )

    # 5. Generate Remediation & Tests
    remediation_res = RiskEngine.generate_remediation_and_tests(
        start_node=target,
        impacted_nodes=blast_res["impacted_nodes"],
        is_breaking=diff["is_breaking"]
    )

    # Persist simulation run
    sim_id = f"sim-{int(db.query(SimulationModel).count()) + 101}"

    # Construct complete response
    response_data = {
        "status": "success",
        "simulation_id": sim_id,
        "target_component": target,
        "schema_modifications": diff,
        "blast_radius_analysis": {
            "start_node": blast_res["start_node"],
            "impacted_nodes": blast_res["impacted_nodes"],
            "impacted_count": blast_res["impacted_count"],
            "paths": blast_res["paths"],
            "evidence_paths": blast_res["evidence_paths"],
            "risk_score": risk_res["risk_score"],
            "risk_level": risk_res["risk_level"],
            "node_details": blast_res["node_details"]
        },
        "policy_violations": violations,
        "remediation_steps": remediation_res["remediation_steps"],
        "test_recommendations": remediation_res["test_recommendations"],
        "risk_breakdown": risk_res["breakdown"]
    }

    db_sim = SimulationModel(
        id=sim_id,
        name=payload.name or f"Simulate {target}",
        target_component=target,
        category="Database Schema (DDL)",
        risk_score=risk_res["risk_score"],
        risk_level=risk_res["risk_level"],
        status=risk_res["status"],
        v1_sql=v1,
        v2_sql=v2,
        result_json=json.dumps(response_data)
    )
    db.add(db_sim)
    db.commit()

    return response_data


@router.post("/schema-simulate")
def schema_simulate(payload: SimulationRequest, db: Session = Depends(get_db)):
    return simulate_change(payload, db)


@router.post("/universal-simulate")
def universal_simulate(payload: SimulationRequest, db: Session = Depends(get_db)):
    return simulate_change(payload, db)


@router.get("/simulations")
def get_simulations(db: Session = Depends(get_db)):
    """
    Returns recorded simulation runs history.
    """
    sims = db.query(SimulationModel).order_by(SimulationModel.created_at.desc()).all()
    results = []
    for s in sims:
        try:
            res_dict = json.loads(s.result_json)
        except Exception:
            res_dict = {}
        results.append({
            "id": s.id,
            "name": s.name,
            "targetComponent": s.target_component,
            "category": s.category,
            "changeSummary": s.v2_sql,
            "v1Sql": s.v1_sql,
            "v2Sql": s.v2_sql,
            "riskScore": s.risk_score,
            "severity": s.risk_level,
            "status": s.status,
            "affectedNodesCount": res_dict.get("blast_radius_analysis", {}).get("impacted_count", 0),
            "affectedNodesList": res_dict.get("blast_radius_analysis", {}).get("impacted_nodes", []),
            "timestamp": s.created_at.strftime("%Y-%m-%d %H:%M UTC") if s.created_at else "Just now",
            "policyViolations": res_dict.get("policy_violations", [])
        })
    return results


@router.delete("/simulations/{simulation_id}")
def delete_simulation(simulation_id: str, db: Session = Depends(get_db)):
    sim = db.query(SimulationModel).filter(SimulationModel.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation record not found")
    db.delete(sim)
    db.commit()
    return {"status": "success", "message": f"Deleted simulation {simulation_id}"}


@router.post("/simulations/compare")
def compare_simulations(payload: CompareRequest, db: Session = Depends(get_db)):
    sim_a = db.query(SimulationModel).filter(SimulationModel.id == payload.simulation_id_a).first()
    sim_b = db.query(SimulationModel).filter(SimulationModel.id == payload.simulation_id_b).first()

    if not sim_a or not sim_b:
        raise HTTPException(status_code=404, detail="One or both simulation records not found")

    res_a = json.loads(sim_a.result_json)
    res_b = json.loads(sim_b.result_json)

    return {
        "simulation_a": {
            "id": sim_a.id,
            "name": sim_a.name,
            "target": sim_a.target_component,
            "risk_score": sim_a.risk_score,
            "v2_sql": sim_a.v2_sql,
            "blast_radius": res_a.get("blast_radius_analysis", {})
        },
        "simulation_b": {
            "id": sim_b.id,
            "name": sim_b.name,
            "target": sim_b.target_component,
            "risk_score": sim_b.risk_score,
            "v2_sql": sim_b.v2_sql,
            "blast_radius": res_b.get("blast_radius_analysis", {})
        },
        "score_delta": round(abs(sim_a.risk_score - sim_b.risk_score), 1)
    }
