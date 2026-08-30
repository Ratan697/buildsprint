"""
backend/app/db/models.py

SQLAlchemy ORM models for ChangeShield core entities.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, DateTime, Boolean, Integer
from app.db.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="admin")
    created_at = Column(DateTime, default=utc_now)


class SystemModel(Base):
    __tablename__ = "systems"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    source_type = Column(String, nullable=False)
    source_label = Column(String, nullable=True)
    repo_url = Column(String, nullable=True)
    branch = Column(String, nullable=True, default="main")
    last_commit_sha = Column(String, nullable=True)
    last_commit_message = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Healthy")
    stats_json = Column(Text, nullable=False)
    graph_json = Column(Text, nullable=False)
    components_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class SimulationModel(Base):
    __tablename__ = "simulations"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    target_component = Column(String, nullable=False)
    category = Column(String, nullable=False, default="Database Schema (DDL)")
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)  # 'Low', 'Medium', 'High', 'Critical'
    status = Column(String, nullable=False, default="Passed")  # 'Passed', 'Blocked', 'Needs Review'
    v1_sql = Column(Text, nullable=False)
    v2_sql = Column(Text, nullable=False)
    result_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)


class RiskRuleModel(Base):
    __tablename__ = "risk_rules"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)  # 'Database Safety', 'Schema Integrity', 'Governance', 'Blast Radius'
    severity = Column(String, nullable=False)  # 'Critical', 'High', 'Medium', 'Low'
    priority = Column(String, nullable=False, default="P1 (High)")
    target_pattern = Column(String, nullable=False, default="*")
    trigger_condition = Column(Text, nullable=False)
    action_enforced = Column(String, nullable=False, default="Block Migration")  # 'Block Migration', 'Require Approval', 'Warn Only'
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=utc_now)


class AuditReportModel(Base):
    __tablename__ = "audit_reports"

    id = Column(String, primary_key=True, index=True)
    simulation_id = Column(String, nullable=True)
    system_name = Column(String, nullable=False)
    target_component = Column(String, nullable=False)
    environment = Column(String, nullable=False, default="Production")
    commit_sha = Column(String, nullable=False, default="9b8c2f1")
    branch = Column(String, nullable=False, default="main")
    author = Column(String, nullable=False, default="alex.chen@changeshield.io")
    reviewer = Column(String, nullable=False, default="sarah.jenkins@changeshield.io")
    change_summary = Column(Text, nullable=False)
    risk_score = Column(Float, nullable=False)
    severity = Column(String, nullable=False)
    status = Column(String, nullable=False)  # 'Approved', 'Blocked', 'Review Required'
    affected_nodes_count = Column(Integer, nullable=False, default=0)
    report_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)


class ApiKeyModel(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    prefix = Column(String, nullable=False)
    secret_hash = Column(String, nullable=False)
    scope = Column(String, nullable=False, default="Full Access")  # 'Full Access', 'Read Only'
    created_date = Column(String, nullable=False)
    last_used = Column(String, nullable=False, default="Never")
    created_at = Column(DateTime, default=utc_now)


class WorkspaceSettingsModel(Base):
    __tablename__ = "workspace_settings"

    id = Column(String, primary_key=True, index=True, default="default")
    workspace_name = Column(String, nullable=False, default="ChangeShield Core")
    org_slug = Column(String, nullable=False, default="changeshield-enterprise")
    default_env = Column(String, nullable=False, default="Production")
    retention_policy = Column(String, nullable=False, default="90 Days")
    auto_block_threshold = Column(Float, nullable=False, default=8.0)
    block_on_critical = Column(Boolean, nullable=False, default=True)
    require_dual_signoff = Column(Boolean, nullable=False, default=True)
    enforce_deprecation_window = Column(Boolean, nullable=False, default=True)
    max_hops_limit = Column(Integer, nullable=False, default=3)
    slack_webhook_url = Column(String, nullable=True)
    pagerduty_key = Column(String, nullable=True)
    datadog_api_key = Column(String, nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
