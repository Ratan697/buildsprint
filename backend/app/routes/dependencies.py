"""
backend/app/routes/dependencies.py

Topology graph extraction, directed edges, multi-hop path tracing, and node inspection routes.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.analysis.blast_radius import BlastRadiusAnalyzer

router = APIRouter(prefix="/dependencies", tags=["Dependencies & Topology"])


class TracePathRequest(BaseModel):
    source_node: str
    target_node: Optional[str] = None
    max_hops: Optional[int] = 4


@router.get("/topology")
def get_topology():
    """
    Returns complete microservice & database architecture topology graph.
    """
    analyzer = BlastRadiusAnalyzer()
    return analyzer.graph


@router.post("/trace-path")
def trace_path(payload: TracePathRequest):
    """
    Traces blast radius impact paths from source_node.
    """
    analyzer = BlastRadiusAnalyzer()
    res = analyzer.analyze(start_node=payload.source_node, max_depth=payload.max_hops or 4)

    return {
        "source_node": payload.source_node,
        "impacted_nodes": res["impacted_nodes"],
        "impacted_count": res["impacted_count"],
        "paths": res["paths"],
        "evidence_paths": res["evidence_paths"],
        "node_details": res["node_details"]
    }


@router.get("/nodes/{node_id}")
def get_node_details(node_id: str):
    """
    Returns component metadata, incoming callers, and outgoing dependencies.
    """
    analyzer = BlastRadiusAnalyzer()
    services = analyzer.services

    matched_key = None
    for s_id in services:
        if node_id.lower() in s_id.lower() or s_id.lower() in node_id.lower():
            matched_key = s_id
            break

    if not matched_key:
        raise HTTPException(status_code=404, detail=f"Component '{node_id}' not found in topology graph")

    incoming = []
    outgoing = []

    for edge in analyzer.graph.get("edges", []):
        if edge["target"] == matched_key:
            incoming.append(edge["source"])
        if edge["source"] == matched_key:
            outgoing.append(edge["target"])

    return {
        "id": matched_key,
        "details": services[matched_key],
        "incoming_callers": list(set(incoming)),
        "outgoing_dependencies": list(set(outgoing))
    }
