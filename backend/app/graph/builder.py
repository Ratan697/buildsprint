import networkx as nx
import json

def load_graph_from_json(file_path: str) -> nx.DiGraph:
    G = nx.DiGraph()
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    for node in data.get('nodes', []):
        G.add_node(node['id'], type=node.get('type', 'service'))
        
    for edge in data.get('edges', []):
        G.add_edge(edge['source'], edge['target'], relation=edge.get('relation', 'depends_on'))
        
    return G

