"""
backend/app/routes/ingest.py

FastAPI APIRouter for system topology and schema ingestion with SQLite persistence.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import SystemModel
from app.parsers.ingest_parser import parse_system_content

router = APIRouter(prefix="/ingest", tags=["Ingestion"])


class RawIngestRequest(BaseModel):
    name: str = Field(..., description="System or topology name")
    source_type: str = Field(..., description="Type of source content: 'sql', 'openapi', or 'json'")
    content: str = Field(..., description="Raw string content of the schema or spec")


class SystemStats(BaseModel):
    services: int
    apis: int
    databases: int
    edges: int


class IngestResponse(BaseModel):
    status: str
    system_id: str
    name: str
    source_type: str
    stats: SystemStats
    graph: Dict[str, List[Dict[str, Any]]]


def calculate_system_stats(graph: Dict[str, Any]) -> SystemStats:
    """
    Calculates statistics on services, APIs, databases, and edges from graph topology.
    """
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    services = 0
    apis = 0
    databases = 0

    for node in nodes:
        node_type = str(node.get("type", "")).lower()
        if "database" in node_type or "db" in node_type or "table" in node_type:
            databases += 1
        elif "api" in node_type or "endpoint" in node_type:
            apis += 1
        else:
            services += 1

    return SystemStats(
        services=services,
        apis=apis,
        databases=databases,
        edges=len(edges)
    )


@router.post(
    "/file",
    response_model=IngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest System Topology via File Upload",
    description="Accepts an uploaded file (.sql, .json, .yaml, .yml) and parses it into system nodes and edges."
)
async def ingest_file(
    file: UploadFile = File(...),
    source_type: str = Form(..., description="Source format: 'sql', 'openapi', or 'json'"),
    db: Session = Depends(get_db)
) -> IngestResponse:
    try:
        raw_bytes = await file.read()
        content = raw_bytes.decode("utf-8")
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to read uploaded file: {err}"
        ) from err

    try:
        parsed_graph = parse_system_content(source_type=source_type, content=content)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        ) from err

    system_id = str(uuid.uuid4())
    system_name = file.filename or f"system-{system_id[:8]}"
    stats = calculate_system_stats(parsed_graph)

    stats_dict = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
    system_record = SystemModel(
        id=system_id,
        name=system_name,
        source_type=source_type.lower(),
        stats_json=json.dumps(stats_dict),
        graph_json=json.dumps(parsed_graph),
        created_at=datetime.now(timezone.utc)
    )

    db.add(system_record)
    db.commit()

    return IngestResponse(
        status="success",
        system_id=system_id,
        name=system_name,
        source_type=source_type.lower(),
        stats=stats,
        graph=parsed_graph
    )


@router.post(
    "/raw",
    response_model=IngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest System Topology via Raw Content Payload",
    description="Parses raw string content (SQL, OpenAPI YAML/JSON, or JSON topology) into graph topology."
)
def ingest_raw(
    payload: RawIngestRequest,
    db: Session = Depends(get_db)
) -> IngestResponse:
    try:
        parsed_graph = parse_system_content(source_type=payload.source_type, content=payload.content)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        ) from err

    system_id = str(uuid.uuid4())
    stats = calculate_system_stats(parsed_graph)

    stats_dict = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
    system_record = SystemModel(
        id=system_id,
        name=payload.name,
        source_type=payload.source_type.lower(),
        stats_json=json.dumps(stats_dict),
        graph_json=json.dumps(parsed_graph),
        created_at=datetime.now(timezone.utc)
    )

    db.add(system_record)
    db.commit()

    return IngestResponse(
        status="success",
        system_id=system_id,
        name=payload.name,
        source_type=payload.source_type.lower(),
        stats=stats,
        graph=parsed_graph
    )


@router.get(
    "/systems",
    status_code=status.HTTP_200_OK,
    summary="List All Ingested Systems",
    description="Returns list of all stored systems and their statistics."
)
def list_systems(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    records = db.query(SystemModel).order_by(SystemModel.created_at.desc()).all()
    return [
        {
            "system_id": sys.id,
            "name": sys.name,
            "source_type": sys.source_type,
            "stats": json.loads(sys.stats_json),
            "created_at": (sys.created_at.replace(tzinfo=timezone.utc) if sys.created_at.tzinfo is None else sys.created_at).isoformat() if sys.created_at else None
        }
        for sys in records
    ]


@router.get(
    "/systems/{system_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Specific System Topology",
    description="Returns graph topology and statistics of a specific system by ID."
)
def get_system(system_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    sys = db.query(SystemModel).filter(SystemModel.id == system_id).first()
    if not sys:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"System with ID '{system_id}' not found."
        )
    return {
        "system_id": sys.id,
        "name": sys.name,
        "source_type": sys.source_type,
        "stats": json.loads(sys.stats_json),
        "graph": json.loads(sys.graph_json),
        "created_at": sys.created_at.isoformat() if sys.created_at else None
    }
