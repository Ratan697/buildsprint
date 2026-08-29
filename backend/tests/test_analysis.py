"""
backend/tests/test_analysis.py

Unit tests for ChangeShield SQL comparison, blast radius traversal, and API simulation routes.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.parsers.sql_parser import compare_schemas
from app.analysis.blast_radius import DependencyGraph

client = TestClient(app)


def test_compare_schemas_breaking_changes():
    v1 = """
    CREATE TABLE users (
        id INT PRIMARY KEY,
        email VARCHAR(255),
        status INT
    );
    """
    v2 = """
    CREATE TABLE users (
        id UUID PRIMARY KEY,
        email VARCHAR(255),
        phone VARCHAR(20)
    );
    """
    diff = compare_schemas(v1, v2, dialect="postgres", as_json=False)

    assert "users" in diff["columns_modified"]
    assert diff["columns_modified"]["users"]["id"]["old_type"] == "INT"
    assert diff["columns_modified"]["users"]["id"]["new_type"] == "UUID"
    assert "status" in diff["columns_dropped"]["users"]
    assert "phone" in diff["columns_added"]["users"]
    assert diff["summary"]["is_breaking"] is True


def test_blast_radius_traversal():
    graph_data = {
        "services": [
            {"id": "db-users", "criticality": 5.0, "type": "database"},
            {"id": "user-service", "criticality": 4.0, "type": "backend"},
            {"id": "api-gateway", "criticality": 3.0, "type": "gateway"},
        ],
        "edges": [
            {"source": "user-service", "target": "db-users", "relation": "reads_writes"},
            {"source": "api-gateway", "target": "user-service", "relation": "calls"},
        ],
    }

    graph = DependencyGraph(graph_data)
    result = graph.analyze_blast_radius(start_node="db-users", reverse_direction=True)

    assert result["start_node"] == "db-users"
    assert "user-service" in result["impacted_nodes"]
    assert "api-gateway" in result["impacted_nodes"]
    assert result["impacted_count"] == 2
    assert result["risk_score"] > 5.0


def test_simulate_api_endpoint():
    payload = {
        "name": "Integration Test Run",
        "target_component": "db-users",
        "v1_sql": "CREATE TABLE users (id INT PRIMARY KEY);",
        "v2_sql": "CREATE TABLE users (id UUID PRIMARY KEY);",
    }
    response = client.post("/analysis/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert data["target_component"] == "db-users"
    assert "blast_radius_analysis" in data
    assert "simulation_id" in data

