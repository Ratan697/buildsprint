"""
backend/app/routes/settings.py

Workspace settings, API key management, and integration preferences routes.
"""

import hashlib
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import WorkspaceSettingsModel, ApiKeyModel

router = APIRouter(prefix="/settings", tags=["Workspace Settings & API Keys"])


class WorkspaceSettingsUpdateRequest(BaseModel):
    workspace_name: Optional[str] = "ChangeShield Core"
    org_slug: Optional[str] = "changeshield-enterprise"
    default_env: Optional[str] = "Production"
    retention_policy: Optional[str] = "90 Days"
    auto_block_threshold: Optional[float] = 8.0
    block_on_critical: Optional[bool] = True
    require_dual_signoff: Optional[bool] = True
    enforce_deprecation_window: Optional[bool] = True
    max_hops_limit: Optional[int] = 3


class ApiKeyGenerateRequest(BaseModel):
    name: str
    scope: Optional[str] = "Full Access"


@router.get("/workspace")
def get_workspace_settings(db: Session = Depends(get_db)):
    ws = db.query(WorkspaceSettingsModel).filter(WorkspaceSettingsModel.id == "default").first()
    if not ws:
        ws = WorkspaceSettingsModel(id="default")
        db.add(ws)
        db.commit()
        db.refresh(ws)

    return {
        "workspaceName": ws.workspace_name,
        "orgSlug": ws.org_slug,
        "defaultEnv": ws.default_env,
        "retentionPolicy": ws.retention_policy,
        "autoBlockThreshold": ws.auto_block_threshold,
        "blockOnCritical": ws.block_on_critical,
        "requireDualSignoff": ws.require_dual_signoff,
        "enforceDeprecationWindow": ws.enforce_deprecation_window,
        "maxHopsLimit": ws.max_hops_limit
    }


@router.post("/workspace")
def update_workspace_settings(payload: WorkspaceSettingsUpdateRequest, db: Session = Depends(get_db)):
    ws = db.query(WorkspaceSettingsModel).filter(WorkspaceSettingsModel.id == "default").first()
    if not ws:
        ws = WorkspaceSettingsModel(id="default")
        db.add(ws)

    if payload.workspace_name: ws.workspace_name = payload.workspace_name
    if payload.org_slug: ws.org_slug = payload.org_slug
    if payload.default_env: ws.default_env = payload.default_env
    if payload.retention_policy: ws.retention_policy = payload.retention_policy
    if payload.auto_block_threshold is not None: ws.auto_block_threshold = payload.auto_block_threshold
    if payload.block_on_critical is not None: ws.block_on_critical = payload.block_on_critical
    if payload.require_dual_signoff is not None: ws.require_dual_signoff = payload.require_dual_signoff
    if payload.enforce_deprecation_window is not None: ws.enforce_deprecation_window = payload.enforce_deprecation_window
    if payload.max_hops_limit is not None: ws.max_hops_limit = payload.max_hops_limit

    db.commit()
    return {"status": "success", "message": "Updated workspace settings"}


@router.get("/api-keys")
def list_api_keys(db: Session = Depends(get_db)):
    keys = db.query(ApiKeyModel).order_by(ApiKeyModel.created_at.desc()).all()
    if not keys:
        default_key = ApiKeyModel(
            id="key-1",
            name="GitHub Actions CI/CD Pipeline",
            prefix="cs_live_98f7...a812",
            secret_hash=hashlib.sha256(b"cs_live_98f7").hexdigest(),
            scope="Full Access",
            created_date="2026-07-12",
            last_used="10 mins ago"
        )
        db.add(default_key)
        db.commit()
        keys = db.query(ApiKeyModel).all()

    return [
        {
            "id": k.id,
            "name": k.name,
            "prefix": k.prefix,
            "createdDate": k.created_date,
            "lastUsed": k.last_used,
            "scope": k.scope
        }
        for k in keys
    ]


@router.post("/api-keys")
def generate_api_key(payload: ApiKeyGenerateRequest, db: Session = Depends(get_db)):
    raw_secret = f"cs_live_{secrets.token_hex(16)}"
    prefix = f"{raw_secret[:12]}...****"
    secret_hash = hashlib.sha256(raw_secret.encode()).hexdigest()
    key_id = f"key-{int(db.query(ApiKeyModel).count()) + 101}"

    db_key = ApiKeyModel(
        id=key_id,
        name=payload.name,
        prefix=prefix,
        secret_hash=secret_hash,
        scope=payload.scope or "Full Access",
        created_date="Today",
        last_used="Never"
    )
    db.add(db_key)
    db.commit()

    return {
        "status": "success",
        "id": key_id,
        "prefix": prefix,
        "secret_token": raw_secret,
        "message": "Store this secret token now. It will not be shown again."
    }


@router.delete("/api-keys/{key_id}")
def revoke_api_key(key_id: str, db: Session = Depends(get_db)):
    key_obj = db.query(ApiKeyModel).filter(ApiKeyModel.id == key_id).first()
    if not key_obj:
        raise HTTPException(status_code=404, detail="API Key not found")
    db.delete(key_obj)
    db.commit()
    return {"status": "success", "message": f"Revoked API Key {key_id}"}
