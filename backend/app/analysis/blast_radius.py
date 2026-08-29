import networkx as nx
from typing import Dict, List, Any, Optional

class DependencyGraph:
    def __init__(self, data: Optional[Dict[str, Any]] = None):
        self.graph = nx.DiGraph()
        if data:
            self.build_graph(data)

    def build_graph(self, data: Dict[str, Any]) -> nx.DiGraph:
        self.graph.clear()
        services = data.get("services") or data.get("nodes") or []
        for service in services:
            service_id = service.get("id")
            if service_id:
                attrs = {k: v for k, v in service.items() if k != "id"}
                self.graph.add_node(service_id, **attrs)
        for edge in data.get("edges", []):
            source, target = edge.get("source"), edge.get("target")
            if source and target:
                attrs = {k: v for k, v in edge.items() if k not in ("source", "target")}
                self.graph.add_edge(source, target, **attrs)
        return self.graph

    def analyze_blast_radius(self, start_node: str, reverse_direction: bool = True, max_depth: Optional[int] = None) -> Dict[str, Any]:
        if start_node not in self.graph:
            raise ValueError(f"Target component '{start_node}' not found in dependency graph.")
        
        working_graph = self.graph.reverse(copy=False) if reverse_direction else self.graph
        lengths = nx.single_source_shortest_path_length(working_graph, start_node, cutoff=max_depth)
        impacted_nodes = [node for node in lengths if node != start_node]
        
        all_paths, total_risk, node_details = {}, 0.0, {}
        for target in impacted_nodes:
            paths = list(nx.all_simple_paths(working_graph, source=start_node, target=target))
            all_paths[target] = paths
            
        for node in impacted_nodes:
            depth = lengths[node]
            attrs = self.graph.nodes[node]
            criticality = float(attrs.get("criticality", 1.0))
            node_risk = criticality * (1.0 / depth)
            total_risk += node_risk
            node_details[node] = {
                "depth": depth,
                "criticality": criticality,
                "risk_contribution": round(node_risk, 2),
                "attributes": dict(attrs)
            }
            
        start_criticality = float(self.graph.nodes[start_node].get("criticality", 1.0))
        return {
            "start_node": start_node,
            "impacted_nodes": impacted_nodes,
            "impacted_count": len(impacted_nodes),
            "paths": all_paths,
            "risk_score": round(start_criticality + total_risk, 2),
            "node_details": node_details
        }