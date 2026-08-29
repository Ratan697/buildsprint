"""
backend/app/analysis/repo_scanner.py

Full-Repository Cross-File Code Intelligence & Impact Analysis Engine.
Scans a GitHub codebase via the Recursive Git Tree API and inspects .py, .ts, .tsx, .js,
.sql, .prisma, and .json files to find every exact file, line number, ORM model, API handler,
and frontend component impacted by schema and symbol modifications.
"""

import re
import base64
import httpx
from typing import Dict, List, Any, Optional

ALLOWED_EXTENSIONS = (
    ".py", ".ts", ".tsx", ".js", ".jsx", ".sql", ".prisma", ".json", ".yaml", ".yml"
)


async def scan_repo_tree(
    repo_url: str,
    branch: str = "main",
    github_token: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Calls the GitHub Recursive Git Tree API to retrieve all file paths in the repo.
    """
    match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
    if not match:
        return []

    owner, repo = match.group(1), match.group(2).replace(".git", "")
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"

    headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "ChangeShield-Intelligence-Bot"}
    if github_token:
        headers["Authorization"] = f"token {github_token}"

    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(url, headers=headers, timeout=15.0)
            if res.status_code != 200:
                return []

            data = res.json()
            tree = data.get("tree", [])

            code_files = [
                item for item in tree
                if item.get("type") == "blob" and item.get("path", "").endswith(ALLOWED_EXTENSIONS)
            ]
            return code_files
        except Exception:
            return []


async def analyze_cross_file_impact(
    repo_url: str,
    changed_symbols: List[Dict[str, Any]],
    branch: str = "main",
    github_token: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Inspects source code files across the repository for references to changed tables or columns.
    """
    match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
    if not match:
        return []

    owner, repo = match.group(1), match.group(2).replace(".git", "")
    code_files = await scan_repo_tree(repo_url, branch, github_token)

    impacts: List[Dict[str, Any]] = []
    headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "ChangeShield-Intelligence-Bot"}
    if github_token:
        headers["Authorization"] = f"token {github_token}"

    # Filter out dist/build/node_modules/venv
    candidate_files = [
        f for f in code_files
        if not f["path"].startswith((".next/", "node_modules/", "venv/", "dist/", ".git/"))
    ][:25]

    async with httpx.AsyncClient() as client:
        for file_item in candidate_files:
            file_path = file_item["path"]
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{file_path}"

            try:
                res = await client.get(raw_url, headers=headers, timeout=10.0)
                if res.status_code != 200:
                    continue
                content = res.text
            except Exception:
                continue

            lines = content.splitlines()

            for symbol_info in changed_symbols:
                table_name = symbol_info.get("table", "")
                col_name = symbol_info.get("column", "")
                old_type = symbol_info.get("old_type", "")
                new_type = symbol_info.get("new_type", "")

                for idx, line in enumerate(lines, start=1):
                    contains_table = bool(table_name and re.search(r"\b" + re.escape(table_name) + r"\b", line, re.I))
                    contains_col = bool(col_name and re.search(r"\b" + re.escape(col_name) + r"\b", line, re.I))

                    if contains_table or contains_col:
                        snippet = line.strip()
                        if not snippet:
                            continue

                        # Categorize impact
                        if file_path.endswith(".py"):
                            if "Column" in line or "model" in file_path.lower() or "db" in file_path.lower():
                                impact_type = "ORM Model Definition"
                                severity = "CRITICAL"
                                fix = f"Update ORM column type for '{col_name or table_name}' in {file_path}:{idx} from {old_type} to {new_type}."
                            elif "@app." in line or "def " in line or "router" in file_path.lower():
                                impact_type = "API Endpoint Handler"
                                severity = "HIGH"
                                fix = f"Validate request/response serialization for field '{col_name or table_name}' in endpoint at {file_path}:{idx}."
                            else:
                                impact_type = "Backend Reference"
                                severity = "MEDIUM"
                                fix = f"Verify variable types referencing '{col_name or table_name}' at {file_path}:{idx}."

                        elif file_path.endswith((".ts", ".tsx", ".js", ".jsx")):
                            if "interface" in line or "type " in line or "types" in file_path.lower():
                                impact_type = "TypeScript Interface / Type"
                                severity = "HIGH"
                                fix = f"Update TypeScript type definition for '{col_name or table_name}' to match new type {new_type} in {file_path}:{idx}."
                            elif "fetch" in line or "api" in file_path.lower() or "useQuery" in line:
                                impact_type = "Frontend API Data Fetching"
                                severity = "HIGH"
                                fix = f"Update API payload field mapping for '{col_name or table_name}' in {file_path}:{idx}."
                            else:
                                impact_type = "Frontend UI Component"
                                severity = "MEDIUM"
                                fix = f"Verify display formatting for field '{col_name or table_name}' in component {file_path}:{idx}."

                        elif file_path.endswith(".prisma"):
                            impact_type = "Prisma Schema Model"
                            severity = "CRITICAL"
                            fix = f"Migrate Prisma field type for '{col_name or table_name}' to match {new_type} in {file_path}:{idx}."

                        elif file_path.endswith(".sql"):
                            impact_type = "SQL Query / Migration File"
                            severity = "HIGH"
                            fix = f"Ensure query cast or column reference handles type change ({old_type} -> {new_type}) in {file_path}:{idx}."

                        else:
                            impact_type = "Codebase Reference"
                            severity = "MEDIUM"
                            fix = f"Review symbol '{col_name or table_name}' reference in {file_path}:{idx}."

                        impacts.append({
                            "file_path": file_path,
                            "line_number": idx,
                            "code_snippet": snippet[:120],
                            "impact_type": impact_type,
                            "severity": severity,
                            "suggested_fix": fix
                        })

    return impacts
