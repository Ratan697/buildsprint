export type SourceType = 'github' | 'openapi' | 'sql' | 'services_json';

export interface SystemStats {
  services: number;
  apis: number;
  databases: number;
  externalIntegrations: number;
  analysisStatus: 'Ready' | 'Analyzing' | 'Pending' | 'Error';
  lastAnalyzed?: string;
}

export type ChangeTargetCategory = 'Database' | 'API';

export interface SimulationFormData {
  category: ChangeTargetCategory;
  targetComponent: string;
  changeType: string;
  oldValue: string;
  newValue: string;
  description: string;
  v1_sql?: string;
  v2_sql?: string;
}

export interface SimulationItem {
  id: string;
  name: string;
  category: string;
  target: string;
  risk: 'High' | 'Medium' | 'Low';
  executedAt: string;
  status: 'Completed' | 'Failed' | 'In Progress';
}

// Backend specific request and response schemas
export interface BackendGraphService {
  id: string;
  criticality?: number;
  type?: string;
  [key: string]: unknown;
}

export interface BackendGraphEdge {
  source: string;
  target: string;
  relation?: string;
  [key: string]: unknown;
}

export interface BackendGraphData {
  services?: BackendGraphService[];
  nodes?: BackendGraphService[];
  edges?: BackendGraphEdge[];
}

export interface SimulationRequestPayload {
  target_component: string;
  v1_sql?: string;
  v2_sql?: string;
  repo_url?: string;
  branch?: string;
  github_token?: string;
  graph_data?: BackendGraphData;
}

export interface NodeImpactDetail {
  depth: number;
  criticality: number;
  risk_contribution: number;
  attributes: Record<string, unknown>;
}

export interface BlastRadiusReport {
  start_node: string;
  impacted_nodes: string[];
  impacted_count: number;
  paths: Record<string, string[][]>;
  risk_score: number;
  node_details: Record<string, NodeImpactDetail>;
}

export interface CrossFileImpact {
  file_path: string;
  line_number: number;
  code_snippet: string;
  impact_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | string;
  suggested_fix: string;
}

export interface SimulationResponse {
  status: string;
  simulation_id?: string;
  name?: string;
  target_component?: string;
  risk_score?: number;
  risk_level?: string;
  schema_modifications: Record<string, unknown>;
  blast_radius_analysis?: BlastRadiusReport;
  impacted_nodes?: string[];
  impacted_count?: number;
  cross_file_impacts?: CrossFileImpact[];
}

export type ActiveTab = 'overview' | 'evidence' | 'remediation';
