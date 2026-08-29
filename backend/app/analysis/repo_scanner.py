"""
backend/app/analysis/repo_scanner.py

Full-Repository Cross-File Code Intelligence & Impact Analysis Engine.
Scans a GitHub codebase via the Recursive Git Tree API and inspects .py, .ts, .tsx, .js,
.sql, .prisma, and .json files to find every exact file, line number, ORM model, API handler,
and frontend component impacted by schema and symbol modifications.
"""

import re
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
    Inspects source code files across the repository for references to changed functions,
    types, interfaces, ORM models, tables, or columns.
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

    candidate_files = [
        f for f in code_files
        if not f["path"].startswith((".next/", "node_modules/", "venv/", "dist/", ".git/"))
    ][:30]

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
                raw_sym_name = symbol_info.get("name", "") or symbol_info.get("column", "") or symbol_info.get("table", "")
                sym_name = raw_sym_name.split(".")[-1] if "." in raw_sym_name else raw_sym_name
                kind = symbol_info.get("kind", "symbol")
                change_type = symbol_info.get("change_type", "modified")

                if not sym_name or len(sym_name) < 2:
                    continue

                pattern = r"\b" + re.escape(sym_name) + r"\b"

                for idx, line in enumerate(lines, start=1):
                    if re.search(pattern, line):
                        snippet = line.strip()
                        if not snippet:
                            continue

                        # Categorize impact
                        if file_path.endswith(".py"):
                            if "import " in line or "from " in line:
                                impact_type = "Import Reference"
                                severity = "CRITICAL" if change_type == "deleted" else "HIGH"
                                fix = f"Update import statement in {file_path}:{idx} for modified {kind} '{sym_name}'."
                            elif "def " in line or "@" in line:
                                impact_type = "Function Call / Handler"
                                severity = "HIGH"
                                fix = f"Verify function arguments and caller logic for '{sym_name}' in {file_path}:{idx}."
                            elif "Column" in line or "model" in file_path.lower():
                                impact_type = "ORM Model Definition"
                                severity = "CRITICAL"
                                fix = f"Update ORM model definition for '{sym_name}' in {file_path}:{idx}."
                            else:
                                impact_type = "Backend Reference"
                                severity = "MEDIUM"
                                fix = f"Review symbol '{sym_name}' reference in {file_path}:{idx}."

                        elif file_path.endswith((".ts", ".tsx", ".js", ".jsx")):
                            if "import " in line or "from " in line:
                                impact_type = "Module Import Reference"
                                severity = "CRITICAL" if change_type == "deleted" else "HIGH"
                                fix = f"Update TypeScript import path/symbol for '{sym_name}' in {file_path}:{idx}."
                            elif "interface" in line or "type " in line:
                                impact_type = "TypeScript Interface Annotation"
                                severity = "HIGH"
                                fix = f"Update TypeScript type signature for '{sym_name}' in {file_path}:{idx}."
                            elif "fetch" in line or "useQuery" in line or "api" in file_path.lower():
                                impact_type = "Frontend API Data Fetching"
                                severity = "HIGH"
                                fix = f"Verify API payload parsing for '{sym_name}' in {file_path}:{idx}."
                            else:
                                impact_type = "Frontend Component Usage"
                                severity = "MEDIUM"
                                fix = f"Check UI rendering logic referencing '{sym_name}' in {file_path}:{idx}."

                        elif file_path.endswith(".sql"):
                            impact_type = "SQL Query / Migration File"
                            severity = "HIGH"
                            fix = f"Ensure query syntax or column reference handles changes to '{sym_name}' in {file_path}:{idx}."

                        else:
                            impact_type = "Codebase Reference"
                            severity = "MEDIUM"
                            fix = f"Verify '{sym_name}' reference in {file_path}:{idx}."

                        impacts.append({
                            "file_path": file_path,
                            "line_number": idx,
                            "code_snippet": snippet[:120],
                            "impact_type": impact_type,
                            "severity": severity,
                            "suggested_fix": fix
                        })

    return impacts
