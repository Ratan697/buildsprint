"""
backend/app/routes/ingest.py

FastAPI APIRouter for system topology and schema ingestion.
Supports file uploads, raw string content, live PostgreSQL database introspection,
and fetching schema files directly via the GitHub REST API.
"""

import json
import base64
import uuid
import re
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import httpx
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import SystemModel
from app.parsers.ingest_parser import (
    parse_system_content,
)

router = APIRouter(prefix="/ingest", tags=["Ingestion"])


class RawIngestRequest(BaseModel):
    name: str = Field(..., description="System or topology name")
    source_type: str = Field(..., description="Type of source content: 'sql', 'openapi', or 'json'")
    content: str = Field(..., description="Raw string content of the schema or spec")


class PostgresIngestRequest(BaseModel):
    system_name: str = Field(..., description="Target name for the introspected PostgreSQL database system")
    connection_url: str = Field(
        ...,
        description="PostgreSQL connection string (e.g. postgresql://user:password@host:5432/dbname)"
    )


class GithubIngestRequest(BaseModel):
    system_name: str = Field(..., description="Name for the ingested system")
    repo_url: str = Field(..., description="GitHub Repository URL (e.g. https://github.com/owner/repo)")
    file_path: Optional[str] = Field(None, description="Specific file path (e.g. schema.sql or api/openapi.yaml)")
    branch: Optional[str] = Field("main", description="Git branch name")
    github_token: Optional[str] = Field(None, description="Optional GitHub Personal Access Token for private repos")


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
        if "database" in node_type or "db" in node_type:
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
    summary="Ingest System Topology via File Upload"
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

    system_record = SystemModel(
        id=system_id,
        name=system_name,
        source_type=source_type.lower(),
        stats_json=json.dumps(stats.model_dump()),
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
    summary="Ingest System Topology via Raw Content Payload"
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

    system_record = SystemModel(
        id=system_id,
        name=payload.name,
        source_type=payload.source_type.lower(),
        stats_json=json.dumps(stats.model_dump()),
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


@router.post(
    "/postgres",
    response_model=IngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Live PostgreSQL Database Introspection"
)
def ingest_postgres(
    payload: PostgresIngestRequest,
    db: Session = Depends(get_db)
) -> IngestResponse:
    """
    Connects to a live PostgreSQL database, inspects information_schema for tables, columns,
    and foreign key constraints, then generates a system topology graph.
    """
    conn_url = payload.connection_url
    if conn_url.startswith("postgres://"):
        conn_url = conn_url.replace("postgres://", "postgresql://", 1)

    try:
        pg_engine = create_engine(conn_url, connect_args={"connect_timeout": 10})
        nodes = []
        edges = []

        with pg_engine.connect() as conn:
            # 1. Fetch user tables
            tables_query = text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
            """)
            tables = [row[0] for row in conn.execute(tables_query)]

            for table in tables:
                # 2. Fetch columns for each table
                cols_query = text("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = :tbl
                    ORDER BY ordinal_position;
                """)
                columns_rows = conn.execute(cols_query, {"tbl": table}).fetchall()
                columns = [
                    {"name": row[0], "type": str(row[1]).upper(), "nullable": row[2] == "YES"}
                    for row in columns_rows
                ]

                nodes.append({
                    "id": table,
                    "name": table,
                    "type": "database_table",
                    "columns": columns,
                    "criticality": 4.5
                })

            # 3. Fetch foreign key relationships
            fk_query = text("""
                SELECT
                    tc.table_name AS source_table,
                    kcu.column_name AS source_column,
                    ccu.table_name AS target_table,
                    ccu.column_name AS target_column
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                 AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                 AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
            """)
            fk_rows = conn.execute(fk_query).fetchall()
            for row in fk_rows:
                edges.append({
                    "source": row[0],
                    "target": row[2],
                    "relation": "foreign_key",
                    "source_column": row[1],
                    "target_column": row[3]
                })

    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PostgreSQL Introspection Failed: {err}"
        ) from err

    parsed_graph = {"nodes": nodes, "edges": edges}
    system_id = str(uuid.uuid4())
    stats = calculate_system_stats(parsed_graph)

    system_record = SystemModel(
        id=system_id,
        name=payload.system_name,
        source_type="postgres_live",
        stats_json=json.dumps(stats.model_dump()),
        graph_json=json.dumps(parsed_graph),
        created_at=datetime.now(timezone.utc)
    )

    db.add(system_record)
    db.commit()

    return IngestResponse(
        status="success",
        system_id=system_id,
        name=payload.system_name,
        source_type="postgres_live",
        stats=stats,
        graph=parsed_graph
    )


@router.post(
    "/github",
    response_model=IngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Schema or Spec via GitHub REST API"
)
async def ingest_github(
    payload: GithubIngestRequest,
    db: Session = Depends(get_db)
) -> IngestResponse:
    """
    Fetches schema files or OpenAPI specs directly from a GitHub repository via the GitHub REST API.
    """
    match = re.search(r"github\.com/([^/]+)/([^/]+)", payload.repo_url)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GitHub repository URL format. Expected: https://github.com/owner/repo"
        )

    owner, repo = match.group(1), match.group(2).replace(".git", "")
    branch = payload.branch or "main"

    headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "ChangeShield-Ingestion-Bot"}
    if payload.github_token:
        headers["Authorization"] = f"token {payload.github_token}"

    async with httpx.AsyncClient() as client:
        content_str = None
        detected_format = "sql"

        if payload.file_path:
            target_path = payload.file_path.strip("/")
            api_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{target_path}?ref={branch}"
            res = await client.get(api_url, headers=headers, timeout=15.0)

            if res.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"File '{target_path}' not found in GitHub repository {owner}/{repo} (branch: {branch})."
                )
            elif res.status_code != 200:
                raise HTTPException(
                    status_code=res.status_code,
                    detail=f"GitHub API Error: {res.text}"
                )

            data = res.json()
            if data.get("encoding") == "base64" and "content" in data:
                content_str = base64.b64decode(data["content"]).decode("utf-8")
            else:
                content_str = data.get("content", "")

            if target_path.endswith(".yaml") or target_path.endswith(".yml"):
                detected_format = "openapi"
            elif target_path.endswith(".json"):
                detected_format = "openapi" if "openapi" in target_path or "swagger" in target_path else "json"
            else:
                detected_format = "sql"

        else:
            api_url = f"https://api.github.com/repos/{owner}/{repo}/contents?ref={branch}"
            res = await client.get(api_url, headers=headers, timeout=15.0)

            if res.status_code != 200:
                raise HTTPException(
                    status_code=res.status_code,
                    detail=f"Failed to scan GitHub repository: {res.text}"
                )

            items = res.json()
            target_item = None

            if isinstance(items, list):
                for item in items:
                    name = item.get("name", "").lower()
                    if name.endswith(".sql") or "openapi" in name or "swagger" in name or name == "topology.json":
                        target_item = item
                        break

            if not target_item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No suitable .sql, openapi.yaml, or topology.json file found in repository root. Please specify target file_path."
                )

            file_res = await client.get(target_item["url"], headers=headers, timeout=15.0)
            if file_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch file content from GitHub.")

            file_data = file_res.json()
            content_str = base64.b64decode(file_data.get("content", "")).decode("utf-8")
            fname = target_item["name"].lower()
            if fname.endswith(".sql"):
                detected_format = "sql"
            elif fname.endswith(".yaml") or fname.endswith(".yml"):
                detected_format = "openapi"
            else:
                detected_format = "json"

    try:
        parsed_graph = parse_system_content(source_type=detected_format, content=content_str)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse schema fetched from GitHub: {err}"
        ) from err

    system_id = str(uuid.uuid4())
    stats = calculate_system_stats(parsed_graph)

    system_record = SystemModel(
        id=system_id,
        name=payload.system_name,
        source_type="github",
        stats_json=json.dumps(stats.model_dump()),
        graph_json=json.dumps(parsed_graph),
        created_at=datetime.now(timezone.utc)
    )

    db.add(system_record)
    db.commit()

    return IngestResponse(
        status="success",
        system_id=system_id,
        name=payload.system_name,
        source_type="github",
        stats=stats,
        graph=parsed_graph
    )


@router.get(
    "/systems",
    status_code=status.HTTP_200_OK,
    summary="List All Ingested Systems"
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
    summary="Get Specific System Topology"
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
        "created_at": (sys.created_at.replace(tzinfo=timezone.utc) if sys.created_at.tzinfo is None else sys.created_at).isoformat() if sys.created_at else None
    }
