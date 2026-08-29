"""
backend/app/parsers/ingest_parser.py

Parser utilities for the ChangeShield ingestion system.
Parses SQL DDL, OpenAPI specifications, and custom JSON topology files into a unified graph format.
"""

import json
from typing import Dict, List, Any, Optional
import yaml
import sqlglot
from sqlglot import exp


def parse_sql_to_graph(sql_content: str, dialect: str = "postgres") -> Dict[str, Any]:
    """
    Parses SQL DDL statements (using sqlglot) to extract tables as graph nodes
    (type="database_table") and foreign key references as directed edges.

    Args:
        sql_content: String containing SQL DDL statements (CREATE TABLE, etc.).
        dialect: SQL dialect for sqlglot parser (default: 'postgres').

    Returns:
        Dict with "nodes" and "edges" keys.
    """
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

    try:
        statements = sqlglot.parse(sql_content, read=dialect)
    except Exception as err:
        raise ValueError(f"Failed to parse SQL content: {err}") from err

    for stmt in statements:
        if not stmt:
            continue

        if isinstance(stmt, exp.Create) and stmt.args.get("kind") == "TABLE":
            table_expr = stmt.find(exp.Table)
            if not table_expr:
                continue

            table_name = table_expr.name
            columns = []
            schema = stmt.find(exp.Schema)

            if schema:
                for col_def in schema.find_all(exp.ColumnDef):
                    col_name = col_def.this.name
                    kind = col_def.args.get("kind")
                    col_type = kind.sql().upper() if kind else "UNKNOWN"
                    columns.append({"name": col_name, "type": col_type})

                # Extract foreign key constraints and inline references
                for ref in schema.find_all(exp.Reference):
                    target_table = ref.find(exp.Table)
                    if target_table:
                        edges.append({
                            "source": table_name,
                            "target": target_table.name,
                            "relation": "foreign_key"
                        })

            nodes.append({
                "id": table_name,
                "name": table_name,
                "type": "database_table",
                "columns": columns,
                "criticality": 4.0
            })

    return {"nodes": nodes, "edges": edges}


def parse_openapi_to_graph(spec_content: str) -> Dict[str, Any]:
    """
    Parses JSON/YAML OpenAPI / Swagger specifications to extract paths/endpoints
    as graph nodes (type="api_endpoint") and tag/service relations as directed edges.

    Args:
        spec_content: String content of OpenAPI YAML or JSON spec.

    Returns:
        Dict with "nodes" and "edges" keys.
    """
    try:
        if spec_content.strip().startswith("{"):
            data = json.loads(spec_content)
        else:
            data = yaml.safe_load(spec_content)
    except Exception as err:
        raise ValueError(f"Failed to parse OpenAPI YAML/JSON content: {err}") from err

    if not isinstance(data, dict):
        raise ValueError("Invalid OpenAPI specification document format.")

    title = data.get("info", {}).get("title", "API Service")
    service_id = title.lower().replace(" ", "-")

    nodes: List[Dict[str, Any]] = [{
        "id": service_id,
        "name": title,
        "type": "service",
        "version": data.get("info", {}).get("version", "1.0.0"),
        "criticality": 3.0
    }]
    edges: List[Dict[str, Any]] = []

    paths = data.get("paths", {})
    if isinstance(paths, dict):
        for path_str, path_item in paths.items():
            if not isinstance(path_item, dict):
                continue

            for method, operation in path_item.items():
                if method.lower() in ("get", "post", "put", "delete", "patch", "options", "head"):
                    method_upper = method.upper()
                    endpoint_id = f"{service_id}:{method_upper}:{path_str}"
                    op_summary = (
                        operation.get("summary", f"{method_upper} {path_str}")
                        if isinstance(operation, dict)
                        else f"{method_upper} {path_str}"
                    )

                    nodes.append({
                        "id": endpoint_id,
                        "name": f"{method_upper} {path_str}",
                        "type": "api_endpoint",
                        "path": path_str,
                        "method": method_upper,
                        "summary": op_summary,
                        "criticality": 2.0
                    })

                    edges.append({
                        "source": service_id,
                        "target": endpoint_id,
                        "relation": "exposes"
                    })

                    # If endpoint specifies tags, link tag services
                    if isinstance(operation, dict) and "tags" in operation:
                        for tag in operation.get("tags", []):
                            tag_id = str(tag).lower().replace(" ", "-")
                            edges.append({
                                "source": endpoint_id,
                                "target": tag_id,
                                "relation": "tagged_under"
                            })

    return {"nodes": nodes, "edges": edges}


def parse_topology_json(json_content: str) -> Dict[str, Any]:
    """
    Validates and normalizes custom system topology JSON containing services/nodes and edges.

    Args:
        json_content: String containing JSON payload.

    Returns:
        Dict with "nodes" and "edges" keys.
    """
    try:
        data = json.loads(json_content)
    except Exception as err:
        raise ValueError(f"Invalid JSON syntax: {err}") from err

    if not isinstance(data, dict):
        raise ValueError("JSON topology payload must be a JSON object.")

    raw_nodes = data.get("services") or data.get("nodes")
    if raw_nodes is None or not isinstance(raw_nodes, list):
        raise ValueError("JSON topology must contain a 'services' or 'nodes' list.")

    raw_edges = data.get("edges")
    if raw_edges is None or not isinstance(raw_edges, list):
        raise ValueError("JSON topology must contain an 'edges' list.")

    nodes = []
    for node in raw_nodes:
        if not isinstance(node, dict) or "id" not in node:
            raise ValueError("Every node in topology must be an object with an 'id' field.")
        node_copy = dict(node)
        if "name" not in node_copy:
            node_copy["name"] = node_copy["id"]
        if "type" not in node_copy:
            node_copy["type"] = "service"
        nodes.append(node_copy)

    edges = []
    for edge in raw_edges:
        if not isinstance(edge, dict) or "source" not in edge or "target" not in edge:
            raise ValueError("Every edge in topology must have 'source' and 'target' fields.")
        edge_copy = dict(edge)
        if "relation" not in edge_copy:
            edge_copy["relation"] = "depends_on"
        edges.append(edge_copy)

    return {"nodes": nodes, "edges": edges}


def parse_system_content(source_type: str, content: str) -> Dict[str, Any]:
    """
    Dispatcher function calling the appropriate parser based on source_type.

    Args:
        source_type: One of 'sql', 'openapi', or 'json'.
        content: Raw string content to parse.

    Returns:
        Dict containing parsed "nodes" and "edges".
    """
    norm_type = source_type.lower().strip()
    if norm_type == "sql":
        return parse_sql_to_graph(content)
    elif norm_type == "openapi":
        return parse_openapi_to_graph(content)
    elif norm_type == "json":
        return parse_topology_json(content)
    else:
        raise ValueError(f"Unsupported source_type '{source_type}'. Must be 'sql', 'openapi', or 'json'.")

