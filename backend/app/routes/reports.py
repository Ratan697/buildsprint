"""
backend/app/routes/reports.py

Technical audit dossiers and report export routes.
"""

import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import AuditReportModel, SimulationModel

router = APIRouter(prefix="/reports", tags=["Reports & Audit Dossiers"])


@router.get("")
def list_reports(db: Session = Depends(get_db)):
    """
    Returns technical deployment audit dossiers.
    """
    reports = db.query(AuditReportModel).order_by(AuditReportModel.created_at.desc()).all()
    if not reports:
        # Seed default mock report
        seed_report = AuditReportModel(
            id="RPT-2026-8801",
            system_name="E-Commerce Core Platform",
            target_component="db-users / users.customer_id",
            environment="Production",
            commit_sha="9b8c2f1",
            branch="main",
            author="alex.chen@changeshield.io",
            reviewer="sarah.jenkins@changeshield.io",
            change_summary="ALTER TABLE users ALTER COLUMN customer_id TYPE UUID;",
            risk_score=8.6,
            severity="Critical",
            status="Blocked",
            affected_nodes_count=5,
            report_json=json.dumps({
                "v1Sql": "CREATE TABLE users (customer_id INT PRIMARY KEY, email VARCHAR(255));",
                "v2Sql": "CREATE TABLE users (customer_id UUID PRIMARY KEY, email VARCHAR(255));",
                "impactedServices": [
                    {"name": "user-service", "type": "Backend", "criticality": 4.8, "consumers": 4},
                    {"name": "auth-service", "type": "Backend", "criticality": 5.0, "consumers": 6},
                    {"name": "order-service", "type": "Backend", "criticality": 4.2, "consumers": 3},
                    {"name": "checkout-api", "type": "API Gateway", "criticality": 4.0, "consumers": 8},
                    {"name": "analytics-pipeline", "type": "Worker", "criticality": 3.0, "consumers": 2}
                ],
                "evidencePaths": [
                    ["db-users", "user-service", "auth-service", "checkout-api"],
                    ["db-users", "user-service", "order-service", "checkout-api"]
                ],
                "policyViolations": [
                    "Block Dropped Columns / Incompatible Type Alterations on Tier-1 DB",
                    "Detect High Blast Radius Traversal (>3 Hops)"
                ],
                "remediationSteps": [
                    {
                        "title": "Apply Dual-Write Expand/Contract Schema Shim",
                        "action": "Deploy Compatibility Migration",
                        "description": "Add customer_id_uuid alongside customer_id without altering original column type."
                    }
                ],
                "testRecommendations": [
                    "Run end-to-end integration test suite across order-service and auth-service."
                ]
            })
        )
        db.add(seed_report)
        db.commit()
        reports = db.query(AuditReportModel).all()

    results = []
    for r in reports:
        try:
            rpt_dict = json.loads(r.report_json)
        except Exception:
            rpt_dict = {}

        results.append({
            "id": r.id,
            "systemName": r.system_name,
            "targetComponent": r.target_component,
            "environment": r.environment,
            "commitSha": r.commit_sha,
            "branch": r.branch,
            "author": r.author,
            "reviewer": r.reviewer,
            "timestamp": r.created_at.strftime("%Y-%m-%d %H:%M UTC") if r.created_at else "Just now",
            "changeSummary": r.change_summary,
            "v1Sql": rpt_dict.get("v1Sql", "CREATE TABLE users (id INT PRIMARY KEY);"),
            "v2Sql": rpt_dict.get("v2Sql", r.change_summary),
            "riskScore": r.risk_score,
            "severity": r.severity,
            "status": r.status,
            "affectedNodesCount": r.affected_nodes_count,
            "impactedServices": rpt_dict.get("impactedServices", []),
            "evidencePaths": rpt_dict.get("evidencePaths", []),
            "policyViolations": rpt_dict.get("policyViolations", []),
            "remediationSteps": rpt_dict.get("remediationSteps", []),
            "testRecommendations": rpt_dict.get("testRecommendations", [])
        })
    return results


@router.get("/export/csv")
def export_reports_csv(db: Session = Depends(get_db)):
    reports = list_reports(db)
    headers = ["Report ID", "System Name", "Target Component", "Commit SHA", "Risk Score", "Severity", "Status", "Author", "Timestamp"]
    rows = [",".join(headers)]

    for r in reports:
        rows.append(f'"{r["id"]}","{r["systemName"]}","{r["targetComponent"]}","{r["commitSha"]}",{r["riskScore"]},"{r["severity"]}","{r["status"]}","{r["author"]}","{r["timestamp"]}"')

    csv_content = "\n".join(rows)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ChangeShield_Audit_Reports.csv"}
    )
