"""
backend/app/parsers/openapi_parser.py

OpenAPI 3.x / Swagger JSON/YAML parser extracting routes, parameters, and endpoints.
"""

import json
import yaml
from typing import Dict, Any, List


class OpenAPIParser:
    """
    Parses OpenAPI / Swagger definitions into normalized endpoint components.
    """

    @staticmethod
    def parse_spec(spec_text: str) -> Dict[str, Any]:
        """
        Parses raw JSON or YAML OpenAPI text.
        """
        try:
            data = json.loads(spec_text)
        except Exception:
            try:
                data = yaml.safe_load(spec_text)
            except Exception as e:
                return {"error": f"Failed to parse OpenAPI spec: {str(e)}", "endpoints": []}

        endpoints = []
        paths = data.get("paths", {}) if isinstance(data, dict) else {}

        for path, path_item in paths.items():
            if not isinstance(path_item, dict):
                continue
            for method, operation in path_item.items():
                if method.lower() in ["get", "post", "put", "delete", "patch", "options", "head"]:
                    op_dict = operation if isinstance(operation, dict) else {}
                    endpoints.append({
                        "method": method.upper(),
                        "path": path,
                        "summary": op_dict.get("summary", ""),
                        "operation_id": op_dict.get("operationId", f"{method}_{path}"),
                        "tags": op_dict.get("tags", []),
                        "consumers": len(op_dict.get("tags", [])) + 2
                    })

        return {
            "title": data.get("info", {}).get("title", "OpenAPI Service") if isinstance(data, dict) else "OpenAPI Service",
            "version": data.get("info", {}).get("version", "1.0.0") if isinstance(data, dict) else "1.0.0",
            "endpoints": endpoints,
            "endpoint_count": len(endpoints)
        }
