"""
backend/app/parsers/sql_parser.py

SQL DDL parser extracting tables, columns, constraints, dropped columns, and type mutations.
"""

import re
from typing import Dict, Any, List


class SQLParser:
    """
    Parses SQL statements to extract schema entities and compute DDL diffs.
    """

    @staticmethod
    def parse_tables_and_columns(sql_text: str) -> List[Dict[str, Any]]:
        tables = []
        clean_sql = re.sub(r'--.*?\n', '', sql_text)
        clean_sql = re.sub(r'/\*.*?\*/', '', clean_sql, flags=re.DOTALL)

        table_matches = re.findall(
            r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_\.\"]+)\s*\((.*?)\);',
            clean_sql,
            re.IGNORECASE | re.DOTALL
        )

        for table_name, body in table_matches:
            clean_table_name = table_name.replace('"', '').strip()
            columns = []
            lines = [line.strip() for line in body.split(',') if line.strip()]

            for line in lines:
                if re.match(r'^(CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|KEY|INDEX)', line, re.IGNORECASE):
                    continue

                parts = line.split()
                if len(parts) >= 2:
                    col_name = parts[0].replace('"', '').strip()
                    col_type = parts[1].strip()
                    is_pk = 'PRIMARY KEY' in line.upper()
                    is_nullable = 'NOT NULL' not in line.upper()
                    columns.append({
                        "name": col_name,
                        "type": col_type,
                        "is_pk": is_pk,
                        "is_nullable": is_nullable
                    })

            tables.append({
                "table_name": clean_table_name,
                "columns": columns,
                "column_count": len(columns)
            })

        return tables

    @staticmethod
    def compare_schemas(v1_sql: str, v2_sql: str, dialect: str = "postgres", as_json: bool = False) -> Dict[str, Any]:
        """
        Compares v1_sql and v2_sql DDL statements to calculate structural changes.
        """
        v1_tables = {t["table_name"]: t for t in SQLParser.parse_tables_and_columns(v1_sql)}
        v2_tables = {t["table_name"]: t for t in SQLParser.parse_tables_and_columns(v2_sql)}

        dropped_tables = [t for t in v1_tables if t not in v2_tables]
        added_tables = [t for t in v2_tables if t not in v1_tables]

        dropped_columns = {}
        columns_modified = {}
        columns_added = {}
        dropped_columns_list = []
        altered_types_list = []

        # Compare table definitions
        for tbl_name, t1 in v1_tables.items():
            if tbl_name in v2_tables:
                t2 = v2_tables[tbl_name]
                cols1 = {c["name"]: c["type"] for c in t1["columns"]}
                cols2 = {c["name"]: c["type"] for c in t2["columns"]}

                for col_name, col_type in cols1.items():
                    if col_name not in cols2:
                        if tbl_name not in dropped_columns:
                            dropped_columns[tbl_name] = []
                        dropped_columns[tbl_name].append(col_name)
                        dropped_columns_list.append(f"{tbl_name}.{col_name}")
                    elif cols2[col_name].upper() != col_type.upper():
                        if tbl_name not in columns_modified:
                            columns_modified[tbl_name] = {}
                        columns_modified[tbl_name][col_name] = {
                            "old_type": col_type,
                            "new_type": cols2[col_name]
                        }
                        altered_types_list.append({
                            "column": f"{tbl_name}.{col_name}",
                            "old_type": col_type,
                            "new_type": cols2[col_name]
                        })

                for col_name in cols2:
                    if col_name not in cols1:
                        if tbl_name not in columns_added:
                            columns_added[tbl_name] = []
                        columns_added[tbl_name].append(col_name)

        is_breaking = len(dropped_tables) > 0 or len(dropped_columns) > 0 or len(columns_modified) > 0

        return {
            "is_breaking": is_breaking,
            "columns_modified": columns_modified,
            "columns_dropped": dropped_columns,
            "columns_added": columns_added,
            "dropped_tables": dropped_tables,
            "added_tables": added_tables,
            "dropped_columns": dropped_columns_list,
            "altered_types": altered_types_list,
            "summary": {
                "is_breaking": is_breaking,
                "modifications_count": len(dropped_tables) + len(dropped_columns_list) + len(altered_types_list)
            }
        }


# Standalone function alias for backward compatibility
compare_schemas = SQLParser.compare_schemas
