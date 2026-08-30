"""
backend/app/db/seed.py

Automated database seeder ensuring ChangeShield tables are pre-populated with
systems, risk rules, audit dossiers, API keys, and workspace parameters on startup.
"""

import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import (
    SystemModel,
    RiskRuleModel,
    AuditReportModel,
    ApiKeyModel,
    WorkspaceSettingsModel,
)


def seed_default_data():
    """
    Seeds initial records if tables are empty.
    """
    db: Session = SessionLocal()
    try:
        # 1. Seed Systems
        if db.query(SystemModel).count() == 0:
            systems = [
                SystemModel(
                    id="sys-ecom-core",
                    name="E-Commerce Core Platform",
                    source_type="github",
                    source_label="GitHub App (org/ecom-core)",
                    repo_url="https://github.com/org/ecom-core",
                    branch="main",
                    last_commit_sha="9b8c2f1",
                    last_commit_message="feat(orders): update customer_id index & schema relations",
                    status="Healthy",
                    stats_json=json.dumps({
                        "services": 8,
                        "apis": 12,
                        "databases": 4,
                        "externalIntegrations": 2
                    }),
                    graph_json=json.dumps({
                        "nodes": [
                            {"id": "db-users", "type": "database", "criticality": 5.0},
                            {"id": "user-service", "type": "backend", "criticality": 4.8},
                            {"id": "auth-service", "type": "backend", "criticality": 5.0},
                            {"id": "order-service", "type": "backend", "criticality": 4.2},
                            {"id": "checkout-api", "type": "gateway", "criticality": 4.0}
                        ],
                        "edges": [
                            {"source": "user-service", "target": "db-users"},
                            {"source": "auth-service", "target": "user-service"},
                            {"source": "order-service", "target": "user-service"},
                            {"source": "checkout-api", "target": "auth-service"},
                            {"source": "checkout-api", "target": "order-service"}
                        ]
                    }),
                    components_json=json.dumps({
                        "services": [
                            {"name": "user-service", "criticality": 4.8, "type": "backend"},
                            {"name": "order-service", "criticality": 4.2, "type": "backend"},
                            {"name": "auth-service", "criticality": 5.0, "type": "backend"},
                            {"name": "payment-service", "criticality": 4.5, "type": "backend"}
                        ],
                        "endpoints": [
                            {"method": "POST", "path": "/v1/users/register", "consumers": 4},
                            {"method": "GET", "path": "/v1/orders/{id}", "consumers": 3},
                            {"method": "PUT", "path": "/v2/payments/charge", "consumers": 5}
                        ],
                        "tables": [
                            {"name": "users", "columnsCount": 14},
                            {"name": "orders", "columnsCount": 18},
                            {"name": "payments", "columnsCount": 12}
                        ]
                    })
                ),
                SystemModel(
                    id="sys-payment-gw",
                    name="Payment & Settlement Gateway",
                    source_type="postgres",
                    source_label="PostgreSQL Replica (db-payments-prod)",
                    status="Healthy",
                    last_commit_sha="4a1e9c8",
                    last_commit_message="fix(stripe): webhook signature validation retry logic",
                    stats_json=json.dumps({
                        "services": 3,
                        "apis": 6,
                        "databases": 2,
                        "externalIntegrations": 3
                    }),
                    graph_json=json.dumps({
                        "nodes": [
                            {"id": "db-payments", "type": "database", "criticality": 5.0},
                            {"id": "payment-service", "type": "backend", "criticality": 5.0},
                            {"id": "stripe-webhook-gateway", "type": "external", "criticality": 4.0}
                        ],
                        "edges": [
                            {"source": "payment-service", "target": "db-payments"},
                            {"source": "payment-service", "target": "stripe-webhook-gateway"}
                        ]
                    }),
                    components_json=json.dumps({
                        "services": [
                            {"name": "payment-service", "criticality": 5.0, "type": "backend"},
                            {"name": "ledger-sync", "criticality": 4.2, "type": "worker"}
                        ],
                        "endpoints": [
                            {"method": "POST", "path": "/v1/charges/create", "consumers": 6},
                            {"method": "POST", "path": "/v1/webhooks/stripe", "consumers": 2}
                        ],
                        "tables": [
                            {"name": "payments", "columnsCount": 16},
                            {"name": "settlement_ledger", "columnsCount": 22}
                        ]
                    })
                )
            ]
            for s in systems:
                db.add(s)

        # 2. Seed Risk Rules
        if db.query(RiskRuleModel).count() == 0:
            rules = [
                RiskRuleModel(
                    id="rule-1",
                    name="Block Dropped Columns on Tier-1 DB",
                    description="Prevent dropping columns from database tables classified with criticality >= 4.5 without prior deprecation window.",
                    category="Database Safety",
                    severity="Critical",
                    priority="P0 (Emergency)",
                    target_pattern="db-*",
                    trigger_condition="ALTER TABLE ... DROP COLUMN on tier-1 database",
                    action_enforced="Block Migration",
                    is_active=True
                ),
                RiskRuleModel(
                    id="rule-2",
                    name="Detect High Blast Radius Traversal (>3 Hops)",
                    description="Trigger emergency architectural block if proposed change affects downstream consumers >= 4 components deep.",
                    category="Blast Radius",
                    severity="Critical",
                    priority="P0 (Emergency)",
                    target_pattern="*",
                    trigger_condition="BFS graph traversal depth >= 4 nodes",
                    action_enforced="Block Migration",
                    is_active=True
                ),
                RiskRuleModel(
                    id="rule-3",
                    name="Warn on Breaking Foreign Key Alterations",
                    description="Require engineering lead review when removing relational constraints between microservice databases.",
                    category="Schema Integrity",
                    severity="High",
                    priority="P1 (High)",
                    target_pattern="fk_*",
                    trigger_condition="DROP CONSTRAINT or ALTER TABLE ... DROP FOREIGN KEY",
                    action_enforced="Require Approval",
                    is_active=True
                ),
                RiskRuleModel(
                    id="rule-4",
                    name="Non-Concurrent Index Creation Warning",
                    description="Warn on PostgreSQL CREATE INDEX statements missing the CONCURRENTLY keyword to prevent locking writes.",
                    category="Governance",
                    severity="Medium",
                    priority="P2 (Standard)",
                    target_pattern="idx_*",
                    trigger_condition="CREATE INDEX statement missing CONCURRENTLY",
                    action_enforced="Warn Only",
                    is_active=True
                )
            ]
            for r in rules:
                db.add(r)

        # 3. Seed Audit Reports
        if db.query(AuditReportModel).count() == 0:
            reports = [
                AuditReportModel(
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
                        "v1_sql": "CREATE TABLE users (customer_id INT PRIMARY KEY, email VARCHAR(255));",
                        "v2_sql": "CREATE TABLE users (customer_id UUID PRIMARY KEY, email VARCHAR(255));",
                        "impacted_services": [
                            {"name": "user-service", "type": "Backend", "criticality": 4.8, "consumers": 4},
                            {"name": "auth-service", "type": "Backend", "criticality": 5.0, "consumers": 6},
                            {"name": "order-service", "type": "Backend", "criticality": 4.2, "consumers": 3},
                            {"name": "checkout-api", "type": "API Gateway", "criticality": 4.0, "consumers": 8},
                            {"name": "analytics-pipeline", "type": "Worker", "criticality": 3.0, "consumers": 2}
                        ],
                        "evidence_paths": [
                            ["db-users", "user-service", "auth-service", "checkout-api"],
                            ["db-users", "user-service", "order-service", "checkout-api"],
                            ["db-users", "user-service", "analytics-pipeline"]
                        ],
                        "policy_violations": [
                            "Block Dropped Columns / Incompatible Type Alterations on Tier-1 DB",
                            "Detect High Blast Radius Traversal (>3 Hops)"
                        ],
                        "remediation_steps": [
                            {
                                "title": "Apply Dual-Write Expand/Contract Schema Shim",
                                "action": "Deploy Compatibility Migration",
                                "description": "Add customer_id_uuid alongside customer_id without altering original column type."
                            },
                            {
                                "title": "Update Downstream ORM Models",
                                "action": "Sync Microservice Models",
                                "description": "Update user-service and order-service query adapters to accept stringified UUIDs."
                            }
                        ],
                        "test_recommendations": [
                            "Run end-to-end integration test suite across order-service and auth-service.",
                            "Execute staging dual-write canary regression test."
                        ]
                    })
                ),
                AuditReportModel(
                    id="RPT-2026-8794",
                    system_name="Payment & Settlement Gateway",
                    target_component="payment-service / payments.idempotency_key",
                    environment="Production",
                    commit_sha="4a1e9c8",
                    branch="main",
                    author="david.kumar@changeshield.io",
                    reviewer="security-automated-bot",
                    change_summary="ALTER TABLE payments ADD COLUMN idempotency_key VARCHAR(64);",
                    risk_score=3.2,
                    severity="Medium",
                    status="Approved",
                    affected_nodes_count=2,
                    report_json=json.dumps({
                        "v1_sql": "CREATE TABLE payments (id UUID PRIMARY KEY, amount DECIMAL(10,2));",
                        "v2_sql": "CREATE TABLE payments (id UUID PRIMARY KEY, amount DECIMAL(10,2), idempotency_key VARCHAR(64));",
                        "impacted_services": [
                            {"name": "payment-service", "type": "Backend", "criticality": 5.0, "consumers": 5},
                            {"name": "stripe-webhook-gateway", "type": "External API", "criticality": 4.0, "consumers": 2}
                        ],
                        "evidence_paths": [["payment-service", "stripe-webhook-gateway"]],
                        "policy_violations": [],
                        "remediation_steps": [
                            {
                                "title": "Non-Null Constraint Verification",
                                "action": "Apply Default Constraint",
                                "description": "Ensure new idempotency_key column allows NULL during rolling deployment."
                            }
                        ],
                        "test_recommendations": ["Execute payment API idempotency unit test suite."]
                    })
                )
            ]
            for rpt in reports:
                db.add(rpt)

        # 4. Seed API Keys
        if db.query(ApiKeyModel).count() == 0:
            keys = [
                ApiKeyModel(
                    id="key-1",
                    name="GitHub Actions CI/CD Pipeline",
                    prefix="cs_live_98f7...a812",
                    secret_hash="hashed_secret_ci_cd",
                    scope="Full Access",
                    created_date="2026-07-12",
                    last_used="10 mins ago"
                ),
                ApiKeyModel(
                    id="key-2",
                    name="Datadog APM Telemetry Export",
                    prefix="cs_live_44b1...e901",
                    secret_hash="hashed_secret_datadog",
                    scope="Read Only",
                    created_date="2026-08-01",
                    last_used="2 hours ago"
                )
            ]
            for k in keys:
                db.add(k)

        # 5. Seed Workspace Settings
        if db.query(WorkspaceSettingsModel).count() == 0:
            settings = WorkspaceSettingsModel(
                id="default",
                workspace_name="ChangeShield Core",
                org_slug="changeshield-enterprise",
                default_env="Production",
                retention_policy="90 Days",
                auto_block_threshold=8.0,
                block_on_critical=True,
                require_dual_signoff=True,
                enforce_deprecation_window=True,
                max_hops_limit=3,
                slack_webhook_url="https://hooks.slack.com/services/T00/B00/XXXXXX",
                pagerduty_key="pd_live_secret_998124",
                datadog_api_key="dd_api_key_441829"
            )
            db.add(settings)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Database seeding error (non-fatal): {e}")
    finally:
        db.close()

