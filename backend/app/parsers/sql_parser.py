"""
backend/app/parsers/sql_parser.py

SQL schema parser and diff engine module using sqlglot.
Extracts CREATE TABLE, ALTER TABLE, and DROP TABLE statements, column definitions,
primary keys, and foreign keys. Compares two SQL schema versions (v1 vs v2) to report
added/dropped tables, added/dropped/modified columns, breaking changes, and summary statistics.
"""

import json
from typing import Dict, List, Any, Optional, Union
import sqlglot
from sqlglot import exp


def parse_schema(
    sql_str: str, dialect: str = "postgres"
) -> Dict[str, Dict[str, Any]]:
    """
    Parses SQL statements (CREATE TABLE, ALTER TABLE, DROP TABLE) and extracts
    tables, column data types, primary keys, and foreign keys.

    Args:
        sql_str: DDL SQL string.
        dialect: Optional sqlglot dialect string (default: 'postgres').

    Returns:
        Dict mapping table_name -> {
            "columns": { col_name: type_str },
            "primary_keys": [ col_name, ... ],
            "foreign_keys": [ { "column": ..., "target_table": ..., "target_column": ... } ]
        }
    """
    tables: Dict[str, Dict[str, Any]] = {}

    try:
        statements = sqlglot.parse(sql_str, read=dialect)
    except Exception as err:
        raise ValueError(f"Failed to parse SQL schema: {err}") from err

    for stmt in statements:
        if not stmt:
            continue

        # Handle CREATE TABLE
        if isinstance(stmt, exp.Create) and stmt.args.get("kind") == "TABLE":
            table_expr = stmt.find(exp.Table)
            if not table_expr:
                continue

            table_name = table_expr.name
            if table_name not in tables:
                tables[table_name] = {
                    "columns": {},
                    "primary_keys": [],
                    "foreign_keys": []
                }

            schema = stmt.find(exp.Schema)
            if schema:
                for col_def in schema.find_all(exp.ColumnDef):
                    col_name = col_def.this.name
                    kind = col_def.args.get("kind")
                    data_type = kind.sql().upper() if kind else "UNKNOWN"
                    tables[table_name]["columns"][col_name] = data_type

                    # Inline PRIMARY KEY constraint check
                    if col_def.find(exp.PrimaryKeyColumnConstraint):
                        if col_name not in tables[table_name]["primary_keys"]:
                            tables[table_name]["primary_keys"].append(col_name)

                # Composite PRIMARY KEY constraint
                for pk in schema.find_all(exp.PrimaryKey):
                    for col_expr in pk.expressions:
                        col_n = col_expr.name
                        if col_n and col_n not in tables[table_name]["primary_keys"]:
                            tables[table_name]["primary_keys"].append(col_n)

                # FOREIGN KEY constraints
                for fk in schema.find_all(exp.ForeignKey):
                    fk_cols = [c.name for c in fk.expressions]
                    ref = fk.find(exp.Reference)
                    if ref:
                        target_table = ref.find(exp.Table)
                        target_cols = [c.name for c in ref.expressions]
                        if target_table:
                            for idx, fk_col in enumerate(fk_cols):
                                target_col = target_cols[idx] if idx < len(target_cols) else ""
                                tables[table_name]["foreign_keys"].append({
                                    "column": fk_col,
                                    "target_table": target_table.name,
                                    "target_column": target_col
                                })

        # Handle ALTER TABLE
        elif isinstance(stmt, exp.Alter) and stmt.args.get("kind") == "TABLE":
            table_expr = stmt.find(exp.Table)
            if not table_expr:
                continue

            table_name = table_expr.name
            if table_name not in tables:
                tables[table_name] = {
                    "columns": {},
                    "primary_keys": [],
                    "foreign_keys": []
                }

            for action in stmt.args.get("actions", []):
                # ADD COLUMN
                if isinstance(action, exp.ColumnDef):
                    col_name = action.this.name
                    kind = action.args.get("kind")
                    data_type = kind.sql().upper() if kind else "UNKNOWN"
                    tables[table_name]["columns"][col_name] = data_type

                # ALTER / MODIFY COLUMN TYPE
                elif isinstance(action, exp.AlterColumn):
                    col_name = action.this.name
                    dtype = action.args.get("dtype") or action.args.get("kind")
                    if dtype:
                        tables[table_name]["columns"][col_name] = dtype.sql().upper()

                # DROP COLUMN
                elif isinstance(action, exp.DropColumn):
                    col_name = action.this.name
                    if col_name in tables[table_name]["columns"]:
                        del tables[table_name]["columns"][col_name]

        # Handle DROP TABLE
        elif isinstance(stmt, exp.Drop) and stmt.args.get("kind") == "TABLE":
            table_expr = stmt.find(exp.Table)
            if table_expr and table_expr.name in tables:
                del tables[table_expr.name]

    return tables


def compare_schemas(
    v1_sql: str,
    v2_sql: str,
    dialect: str = "postgres",
    as_json: bool = False
) -> Union[str, Dict[str, Any]]:
    """
    Compares two SQL schema versions (v1 and v2) to detect table and column changes,
    identifying breaking changes and returning diff metrics.

    Args:
        v1_sql: Original SQL schema string.
        v2_sql: Updated SQL schema string.
        dialect: SQL dialect for sqlglot (default: 'postgres').
        as_json: If True, returns a formatted JSON string; otherwise returns a dict.

    Returns:
        Dict or JSON string containing:
        - tables_added: List[str]
        - tables_dropped: List[str]
        - columns_added: Dict[str, Dict[str, str]]
        - columns_dropped: Dict[str, List[str]]
        - columns_modified: Dict[str, Dict[str, Dict[str, str]]]
        - breaking_changes: List[str]
        - summary: Dict[str, Any]
    """
    schema_v1 = parse_schema(v1_sql, dialect=dialect)
    schema_v2 = parse_schema(v2_sql, dialect=dialect)

    tables_v1 = set(schema_v1.keys())
    tables_v2 = set(schema_v2.keys())

    tables_added = sorted(list(tables_v2 - tables_v1))
    tables_dropped = sorted(list(tables_v1 - tables_v2))

    columns_added: Dict[str, Dict[str, str]] = {}
    columns_dropped: Dict[str, List[str]] = {}
    columns_modified: Dict[str, Dict[str, Dict[str, str]]] = {}
    breaking_changes: List[str] = []

    # Flag dropped tables as breaking changes
    for tbl in tables_dropped:
        breaking_changes.append(f"Table '{tbl}' was dropped.")

    # Compare common tables
    common_tables = tables_v1.intersection(tables_v2)
    for tbl in sorted(common_tables):
        cols_v1 = schema_v1[tbl]["columns"]
        cols_v2 = schema_v2[tbl]["columns"]

        cols1_set = set(cols_v1.keys())
        cols2_set = set(cols_v2.keys())

        # Dropped columns
        dropped_cols = sorted(list(cols1_set - cols2_set))
        if dropped_cols:
            columns_dropped[tbl] = dropped_cols
            for c in dropped_cols:
                breaking_changes.append(f"Column '{c}' dropped from table '{tbl}'.")

        # Added columns
        added_cols = sorted(list(cols2_set - cols1_set))
        if added_cols:
            columns_added[tbl] = {c: cols_v2[c] for c in added_cols}

        # Modified columns
        common_cols = cols1_set.intersection(cols2_set)
        for c in sorted(common_cols):
            old_type = cols_v1[c]
            new_type = cols_v2[c]
            if old_type != new_type:
                if tbl not in columns_modified:
                    columns_modified[tbl] = {}
                columns_modified[tbl][c] = {
                    "old_type": old_type,
                    "new_type": new_type
                }
                breaking_changes.append(
                    f"Column '{c}' in table '{tbl}' type changed from {old_type} to {new_type}."
                )

    total_additions = len(tables_added) + sum(len(v) for v in columns_added.values())
    total_drops = len(tables_dropped) + sum(len(v) for v in columns_dropped.values())
    total_modifications = sum(len(v) for v in columns_modified.values())

    diff_result = {
        "tables_added": tables_added,
        "tables_dropped": tables_dropped,
        "columns_added": columns_added,
        "columns_dropped": columns_dropped,
        "columns_modified": columns_modified,
        "breaking_changes": breaking_changes,
        "summary": {
            "total_additions": total_additions,
            "total_drops": total_drops,
            "total_modifications": total_modifications,
            "is_breaking": len(breaking_changes) > 0
        }
    }

    if as_json:
        return json.dumps(diff_result, indent=2)
    return diff_result