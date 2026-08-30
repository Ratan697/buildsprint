"""
backend/app/routes/risk_rules.py

Risk scoring engine, custom rules CRUD, and explainability sandbox routes.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import RiskRuleModel
from app.analysis.risk_engine import RiskEngine

router = APIRouter(prefix="/risk-rules", tags=["Risk Rules & Scoring Engine"])


class CalculateScoreRequest(BaseModel):
    depth: int = 3
    affected_nodes_count: int = 5
    external_exposure: bool = True
    target_criticality: float = 5.0
    is_breaking_change: bool = True
    weights: Optional[Dict[str, float]] = None


class RiskRuleCreateRequest(BaseModel):
    name: str
    description: str
    category: str = "Database Safety"
    severity: str = "High"
    priority: str = "P1 (High)"
    target_pattern: str = "*"
    trigger_condition: str
    action_enforced: str = "Block Migration"
    is_active: bool = True


@router.post("/calculate-score")
def calculate_score(payload: CalculateScoreRequest):
    """
    Computes mathematical risk score and returns point-by-point explainability breakdown.
    """
    res = RiskEngine.calculate_score(
        depth=payload.depth,
        affected_nodes_count=payload.affected_nodes_count,
        external_exposure=payload.external_exposure,
        target_criticality=payload.target_criticality,
        is_breaking_change=payload.is_breaking_change,
        weights=payload.weights
    )

    return {
        "calculated_risk_score": res["risk_score"],
        "risk_level": res["risk_level"],
        "status": res["status"],
        "explainability_breakdown": res["breakdown"]
    }


@router.get("")
def list_risk_rules(db: Session = Depends(get_db)):
    """
    Returns configured guardrail policies.
    """
    rules = db.query(RiskRuleModel).all()
    if not rules:
        # Seed default rules
        default_seed = [
            RiskRuleModel(
                id="rule-1",
                name="Block Dropped Columns on Tier-1 DB",
                description="Prevents DDL migrations that drop columns from primary production databases without prior deprecation window.",
                category="Database Safety",
                severity="Critical",
                priority="P0 (Emergency)",
                target_pattern="db-users, db-orders",
                trigger_condition="When column drop statement is detected",
                action_enforced="Block Migration",
                is_active=True
            ),
            RiskRuleModel(
                id="rule-2",
                name="Detect High Blast Radius Traversal (>3 Hops)",
                description="Flags schema changes that propagate beyond 3 downstream microservices in dependency graph analysis.",
                category="Blast Radius",
                severity="High",
                priority="P1 (High)",
                target_pattern="*",
                trigger_condition="When blast radius depth > 3 hops",
                action_enforced="Require Approval",
                is_active=True
            ),
            RiskRuleModel(
                id="rule-3",
                name="Warn on Breaking Foreign Key Alterations",
                description="Triggers automated developer warnings when modifying foreign key constraints or data types.",
                category="Schema Integrity",
                severity="High",
                priority="P1 (High)",
                target_pattern="*",
                trigger_condition="When foreign key constraint or type is altered",
                action_enforced="Warn Only",
                is_active=True
            )
        ]
        db.add_all(default_seed)
        db.commit()
        rules = db.query(RiskRuleModel).all()

    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "category": r.category,
            "severity": r.severity,
            "priority": r.priority,
            "targetPattern": r.target_pattern,
            "triggerCondition": r.trigger_condition,
            "actionEnforced": r.action_enforced,
            "isActive": r.is_active
        }
        for r in rules
    ]


@router.post("")
def create_risk_rule(payload: RiskRuleCreateRequest, db: Session = Depends(get_db)):
    rule_id = f"rule-{int(db.query(RiskRuleModel).count()) + 101}"
    db_rule = RiskRuleModel(
        id=rule_id,
        name=payload.name,
        description=payload.description,
        category=payload.category,
        severity=payload.severity,
        priority=payload.priority,
        target_pattern=payload.target_pattern,
        trigger_condition=payload.trigger_condition,
        action_enforced=payload.action_enforced,
        is_active=payload.is_active
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return {"status": "success", "id": db_rule.id, "message": f"Created risk rule {db_rule.name}"}


@router.delete("/{rule_id}")
def delete_risk_rule(rule_id: str, db: Session = Depends(get_db)):
    rule = db.query(RiskRuleModel).filter(RiskRuleModel.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Risk rule not found")
    db.delete(rule)
    db.commit()
    return {"status": "success", "message": f"Deleted rule {rule_id}"}
