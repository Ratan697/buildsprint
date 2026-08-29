"""
backend/app/analysis/universal_diff.py

Universal Multi-Language File Modification Extractor.
Parses diffs and content changes across TypeScript/React (.ts, .tsx), Python (.py),
SQL (.sql), OpenAPI (.yaml, .json), and Config files to extract modified functions,
interfaces, classes, ORM models, and column definitions.
"""

import re
import difflib
from typing import Dict, List, Any


def extract_file_modifications(
    file_path: str,
    v1_content: str,
    v2_content: str,
    file_type: str
) -> List[Dict[str, Any]]:
    """
    Extracts modified or deleted symbols (functions, types, interfaces, models, columns, endpoints)
    from a file content diff.
    """
    symbols: List[Dict[str, Any]] = []
    f_type = file_type.lower().strip()

    # 1. TypeScript / JavaScript / React (.ts, .tsx, .js)
    if f_type in ("typescript", "ts", "tsx", "javascript", "js") or file_path.endswith((".ts", ".tsx", ".js", ".jsx")):
        ts_patterns = [
            (r"export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)", "function"),
            (r"export\s+const\s+([A-Za-z0-9_]+)\s*=", "function/variable"),
            (r"export\s+interface\s+([A-Za-z0-9_]+)", "interface"),
            (r"export\s+type\s+([A-Za-z0-9_]+)", "type"),
            (r"export\s+class\s+([A-Za-z0-9_]+)", "class"),
        ]

        v1_symbols = set()
        for pattern, kind in ts_patterns:
            for match in re.finditer(pattern, v1_content):
                v1_symbols.add((match.group(1), kind))

        v2_symbols = set()
        for pattern, kind in ts_patterns:
            for match in re.finditer(pattern, v2_content):
                v2_symbols.add((match.group(1), kind))

        # Deleted symbols
        for sym, kind in v1_symbols - v2_symbols:
            symbols.append({
                "name": sym,
                "kind": kind,
                "change_type": "deleted",
                "detail": f"Exported {kind} '{sym}' was removed from {file_path}."
            })

        # Modified or Added symbols
        for sym, kind in v2_symbols:
            if sym in [s[0] for s in v1_symbols]:
                symbols.append({
                    "name": sym,
                    "kind": kind,
                    "change_type": "modified",
                    "detail": f"Exported {kind} '{sym}' signature or implementation modified in {file_path}."
                })
            else:
                symbols.append({
                    "name": sym,
                    "kind": kind,
                    "change_type": "added",
                    "detail": f"New exported {kind} '{sym}' added in {file_path}."
                })

    # 2. Python (.py)
    elif f_type in ("python", "py") or file_path.endswith(".py"):
        py_patterns = [
            (r"def\s+([A-Za-z0-9_]+)\s*\(", "function"),
            (r"class\s+([A-Za-z0-9_]+)\s*\(?", "class/model"),
            (r"@app\.(?:get|post|put|delete|patch)\([\"']([^\"']+)[\"']", "route_path"),
        ]

        v1_py = set()
        for pattern, kind in py_patterns:
            for match in re.finditer(pattern, v1_content):
                v1_py.add((match.group(1), kind))

        v2_py = set()
        for pattern, kind in py_patterns:
            for match in re.finditer(pattern, v2_content):
                v2_py.add((match.group(1), kind))

        for sym, kind in v1_py - v2_py:
            symbols.append({
                "name": sym,
                "kind": kind,
                "change_type": "deleted",
                "detail": f"Python {kind} '{sym}' was deleted from {file_path}."
            })

        for sym, kind in v2_py:
            change_t = "modified" if sym in [s[0] for s in v1_py] else "added"
            symbols.append({
                "name": sym,
                "kind": kind,
                "change_type": change_t,
                "detail": f"Python {kind} '{sym}' was {change_t} in {file_path}."
            })

    # 3. SQL Schema (.sql)
    elif f_type in ("sql", "database") or file_path.endswith(".sql"):
        try:
            from app.parsers.sql_parser import compare_schemas
            diff = compare_schemas(v1_content, v2_content, dialect="postgres", as_json=False)

            for tbl in diff.get("tables_dropped", []):
                symbols.append({"name": tbl, "kind": "table", "change_type": "deleted", "detail": f"Table '{tbl}' was dropped."})

            for tbl, cols in diff.get("columns_dropped", {}).items():
                for col in cols:
                    symbols.append({"name": f"{tbl}.{col}", "kind": "column", "change_type": "deleted", "detail": f"Column '{col}' dropped from table '{tbl}'."})

            for tbl, cols in diff.get("columns_modified", {}).items():
                for col, types in cols.items():
                    symbols.append({"name": f"{tbl}.{col}", "kind": "column", "change_type": "modified", "detail": f"Column '{col}' in '{tbl}' type changed from {types.get('old_type')} to {types.get('new_type')}."})

        except Exception:
            pass

    # 4. Fallback diff analyzer for YAML/JSON/Config
    if not symbols:
        diff_lines = list(difflib.unified_diff(v1_content.splitlines(), v2_content.splitlines(), lineterm=""))
        for line in diff_lines:
            if line.startswith("- ") and not line.startswith("---"):
                match = re.search(r"([A-Za-z0-9_]{3,})", line)
                if match:
                    symbols.append({
                        "name": match.group(1),
                        "kind": "config_key/symbol",
                        "change_type": "deleted",
                        "detail": f"Line removed in {file_path}: {line.strip()}"
                    })

    # Ensure at least 1 symbol is returned
    if not symbols:
        symbols.append({
            "name": file_path.split("/")[-1],
            "kind": "file",
            "change_type": "modified",
            "detail": f"File content modified in {file_path}."
        })

    return symbols
