import json
from typing import Dict, Any, Optional, Union
import sqlglot
from sqlglot import exp

def parse_schema(sql_str: str, dialect: Optional[str] = None) -> Dict[str, Dict[str, str]]:
    tables: Dict[str, Dict[str, str]] = {}
    try:
        statements = sqlglot.parse(sql_str, read=dialect)
    except Exception as err:
        raise ValueError(f"Failed to parse SQL schema: {err}") from err

    for stmt in statements:
        if not stmt:
            continue
        if isinstance(stmt, exp.Create) and stmt.args.get("kind") == "TABLE":
            table_expr = stmt.find(exp.Table)
            if not table_expr: continue
            table_name = table_expr.name
            if table_name not in tables: tables[table_name] = {}
            schema = stmt.find(exp.Schema)
            if schema:
                for col_def in schema.find_all(exp.ColumnDef):
                    col_name = col_def.this.name
                    kind = col_def.args.get("kind")
                    tables[table_name][col_name] = kind.sql().upper() if kind else "UNKNOWN"
        elif isinstance(stmt, exp.Alter) and stmt.args.get("kind") == "TABLE":
            table_expr = stmt.find(exp.Table)
            if not table_expr: continue
            table_name = table_expr.name
            if table_name not in tables: tables[table_name] = {}
            for action in stmt.args.get("actions", []):
                if isinstance(action, exp.ColumnDef):
                    col_name = action.this.name
                    kind = action.args.get("kind")
                    tables[table_name][col_name] = kind.sql().upper() if kind else "UNKNOWN"
                elif isinstance(action, exp.AlterColumn):
                    col_name = action.this.name
                    dtype = action.args.get("dtype") or action.args.get("kind")
                    if dtype: tables[table_name][col_name] = dtype.sql().upper()
    return tables

def compare_schemas(v1_sql: str, v2_sql: str, dialect: Optional[str] = None, as_json: bool = False) -> Union[str, Dict]:
    schema_v1 = parse_schema(v1_sql, dialect=dialect)
    schema_v2 = parse_schema(v2_sql, dialect=dialect)
    modified_columns = {}
    for table_name, cols_v1 in schema_v1.items():
        if table_name in schema_v2:
            cols_v2 = schema_v2[table_name]
            for col_name, old_type in cols_v1.items():
                if col_name in cols_v2:
                    new_type = cols_v2[col_name]
                    if old_type != new_type:
                        if table_name not in modified_columns: modified_columns[table_name] = {}
                        modified_columns[table_name][col_name] = {"old_type": old_type, "new_type": new_type}
    return json.dumps(modified_columns, indent=2) if as_json else modified_columns