"""
backend/app/analysis/risk_engine.py

5-Factor weighted risk scoring engine with rule evaluation and explainability breakdown.
"""

from typing import Dict, Any, List


class RiskEngine:
    """
    Computes mathematical risk score (0.0 to 10.0) based on weighted formula:
    Risk = (0.30 * Depth) + (0.25 * AffectedNodes) + (0.20 * ExternalExp) + (0.15 * Criticality) + (0.10 * Severity)
    """

    @staticmethod
    def calculate_score(
        depth: int,
        affected_nodes_count: int,
        external_exposure: bool,
        target_criticality: float,
        is_breaking_change: bool,
        weights: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """
        Calculates mathematical risk score and returns point-by-point breakdown.
        """
        w_depth = weights.get("depth", 0.30) if weights else 0.30
        w_nodes = weights.get("nodes", 0.25) if weights else 0.25
        w_ext = weights.get("external", 0.20) if weights else 0.20
        w_crit = weights.get("criticality", 0.15) if weights else 0.15
        w_sev = weights.get("severity", 0.10) if weights else 0.10

        norm_depth = min(depth / 4.0, 1.0)
        norm_nodes = min(affected_nodes_count / 8.0, 1.0)
        norm_ext = 1.0 if external_exposure else 0.0
        norm_crit = min(target_criticality / 5.0, 1.0)
        norm_sev = 1.0 if is_breaking_change else 0.2

        contrib_depth = norm_depth * (w_depth * 10)
        contrib_nodes = norm_nodes * (w_nodes * 10)
        contrib_ext = norm_ext * (w_ext * 10)
        contrib_crit = norm_crit * (w_crit * 10)
        contrib_sev = norm_sev * (w_sev * 10)

        total_raw = contrib_depth + contrib_nodes + contrib_ext + contrib_crit + contrib_sev
        final_score = min(round(total_raw, 1), 10.0)

        if final_score >= 8.0:
            risk_level = "Critical"
            status = "Blocked"
        elif final_score >= 6.0:
            risk_level = "High"
            status = "Review Required"
        elif final_score >= 4.0:
            risk_level = "Medium"
            status = "Needs Review"
        else:
            risk_level = "Low"
            status = "Passed"

        return {
            "risk_score": final_score,
            "risk_level": risk_level,
            "status": status,
            "breakdown": {
                "contrib_depth": round(contrib_depth, 1),
                "contrib_nodes": round(contrib_nodes, 1),
                "contrib_external": round(contrib_ext, 1),
                "contrib_criticality": round(contrib_crit, 1),
                "contrib_severity": round(contrib_sev, 1)
            }
        }

    @staticmethod
    def evaluate_policy_rules(
        risk_score: float,
        start_node: str,
        is_breaking: bool,
        impacted_count: int
    ) -> List[str]:
        """
        Evaluates active guardrail policies and returns triggered violation alerts.
        """
        violations = []

        if is_breaking and ("db-" in start_node.lower() or "users" in start_node.lower()):
            violations.append("Block Dropped Columns / Incompatible Type Alterations on Tier-1 DB")

        if impacted_count >= 3:
            violations.append("Detect High Blast Radius Traversal (>3 Hops)")

        if is_breaking:
            violations.append("Warn on Breaking Foreign Key Alterations")

        if risk_score >= 8.0:
            violations.append("Require Multi-Review for Criticality > 4.0")

        return violations

    @staticmethod
    def generate_remediation_and_tests(
        start_node: str,
        impacted_nodes: List[str],
        is_breaking: bool
    ) -> Dict[str, Any]:
        """
        Generates step-by-step remediation plan and verification test suites.
        """
        remediation_steps = [
            {
                "title": "Apply Dual-Write Expand/Contract Schema Shim",
                "action": "Deploy Compatibility Migration",
                "description": f"Create an abstraction layer or dual-write column migration on '{start_node}' before cutting over field types."
            },
            {
                "title": "Downstream Service ORM Model Sync",
                "action": "Sync Microservice Repositories",
                "description": f"Update query adapters across affected services ({', '.join(impacted_nodes[:3]) or start_node}) to support updated schema definitions."
            },
            {
                "title": "API Gateway Deprecation Header",
                "action": "Deploy Gateway Facade",
                "description": "Inject Sunset HTTP headers on legacy contract endpoints prior to final schema cutover."
            }
        ]

        test_recommendations = [
            f"Run integration test suite across affected targets: {', '.join(impacted_nodes[:2]) or start_node}.",
            "Execute staging dual-write canary regression test.",
            "Verify API gateway contract validations for request payload compatibility."
        ]

        return {
            "remediation_steps": remediation_steps,
            "test_recommendations": test_recommendations
        }
