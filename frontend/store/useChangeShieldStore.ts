import { create } from 'zustand';
import {
  BackendGraphData,
  SimulationRequestPayload,
  SimulationResponse,
  ActiveTab,
} from '@/lib/types';
import { simulateSchemaImpact, simulateRepoImpact, simulateUniversalImpact } from '@/lib/api';

export interface SystemState {
  currentProject: string;
  graphData: BackendGraphData | null;
  selectedNode: string | null;
  simulationInput: SimulationRequestPayload | null;
  analysisResult: SimulationResponse | null;
  activeTab: ActiveTab;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProject: (project: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setGraphData: (data: BackendGraphData) => void;
  setActiveTab: (tab: ActiveTab) => void;
  runSimulation: (payload: SimulationRequestPayload) => Promise<boolean>;
  clearError: () => void;
  resetSimulation: () => void;
}

const DEFAULT_GRAPH: BackendGraphData = {
  services: [
    { id: 'db-users', criticality: 5.0, type: 'database' },
    { id: 'user-service', criticality: 4.0, type: 'backend' },
    { id: 'auth-service', criticality: 5.0, type: 'backend' },
    { id: 'api-gateway', criticality: 3.0, type: 'gateway' },
  ],
  edges: [
    { source: 'user-service', target: 'db-users', relation: 'reads_writes' },
    { source: 'auth-service', target: 'user-service', relation: 'depends_on' },
    { source: 'api-gateway', target: 'auth-service', relation: 'calls' },
  ],
};

export const useChangeShieldStore = create<SystemState>((set) => ({
  currentProject: 'Default Workspace',
  graphData: DEFAULT_GRAPH,
  selectedNode: null,
  simulationInput: null,
  analysisResult: null,
  activeTab: 'overview',
  isLoading: false,
  error: null,

  setProject: (project) => set({ currentProject: project }),
  setSelectedNode: (nodeId) => set({ selectedNode: nodeId }),
  setGraphData: (data) => set({ graphData: data }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  clearError: () => set({ error: null }),
  resetSimulation: () =>
    set({
      analysisResult: null,
      simulationInput: null,
      selectedNode: null,
      activeTab: 'overview',
      error: null,
    }),

  runSimulation: async (payload) => {
    set({
      isLoading: true,
      error: null,
      analysisResult: null,
      selectedNode: null,
      simulationInput: payload,
    });

    let res;
    if (payload.file_path && payload.v1_content !== undefined) {
      res = await simulateUniversalImpact({
        repo_url: payload.repo_url?.trim() || 'https://github.com/Ratan697/buildsprint',
        branch: payload.branch || 'main',
        github_token: payload.github_token,
        file_path: payload.file_path.trim(),
        file_type: payload.file_type || 'typescript',
        v1_content: payload.v1_content || '',
        v2_content: payload.v2_content || '',
        target_component: payload.target_component || 'api-gateway',
      });
    } else if (payload.repo_url && payload.repo_url.trim()) {
      res = await simulateRepoImpact({
        repo_url: payload.repo_url.trim(),
        branch: payload.branch || 'main',
        github_token: payload.github_token,
        target_component: payload.target_component,
        v1_sql: payload.v1_sql,
        v2_sql: payload.v2_sql,
      });
    } else {
      res = await simulateSchemaImpact(payload);
    }

    if (res.error) {
      set({ isLoading: false, error: res.error });
      return false;
    }

    if (res.data) {
      set({
        isLoading: false,
        analysisResult: res.data,
        error: null,
      });
      return true;
    }

    set({ isLoading: false, error: 'Empty response from backend' });
    return false;
  },
}));
