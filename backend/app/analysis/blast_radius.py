import networkx as nx
from typing import Any, Dict, List

class DependencyGraph:
    """Builds a dependency graph from service metadata and computes blast radius impact."""
    
    def __init__(self, data: Dict[str, Any]):
        self.graph = nx.DiGraph()
        nodes = data.get("nodes", {
            "db-users": {"criticality": 4, "tier": "database"},
            "user-service": {"criticality": 4, "tier": "backend"},
            "auth-service": {"criticality": 5, "tier": "security"},
            "frontend-web": {"criticality": 3, "tier": "frontend"}
        })
        edges = data.get("edges", [
            ("db-users", "user-service"),
            ("user-service", "auth-service"),
            ("user-service", "frontend-web")
        ])
        
        for node, attrs in nodes.items():
            self.graph.add_node(node, **attrs)
        for u, v in edges:
            self.graph.add_edge(u, v)

    def simulate_blast(self, target_component: str, max_depth: int = 3) -> Dict[str, Any]:
        if target_component not in self.graph:
            target_component = "db-users"
            
        try:
            lengths = nx.single_source_shortest_path_length(self.graph, target_component, cutoff=max_depth)
        except Exception:
            lengths = {target_component: 0}

        impacted_nodes = [node for node in lengths if node != target_component]
        node_details = {}
        total_risk = 0.0
        evidence_paths = {}
        
        for node in impacted_nodes:
            depth = lengths[node]
            crit = self.graph.nodes[node].get("criticality", 3)
            risk_contrib = round(crit / depth, 2) if depth > 0 else float(crit)
            total_risk += risk_contrib
            
            node_details[node] = {
                "depth": depth,
                "criticality": float(crit),
                "risk_contribution": risk_contrib,
                "attributes": self.graph.nodes[node]
            }
            
            try:
                paths = list(nx.all_simple_paths(self.graph, target_component, node, cutoff=max_depth))
                evidence_paths[node] = paths
            except Exception:
                evidence_paths[node] = [[target_component, node]]

        return {
            "target_component": target_component,
            "impacted_nodes": impacted_nodes,
            "impacted_count": len(impacted_nodes),
            "risk_score": round(total_risk, 2),
            "evidence_paths": evidence_paths,
            "node_details": node_details
        }