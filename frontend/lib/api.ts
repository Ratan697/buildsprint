/**
 * frontend/lib/api.ts
 * Unified API client library connecting ChangeShield frontend to FastAPI backend.
 */

import { BACKEND_URL } from './config';
import { SimulationRequestPayload, SimulationResponse, BackendGraphData } from './types';

const API_BASE_URL = BACKEND_URL || 'http://localhost:8000';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status?: number;
}

export interface SystemStats {
  services: number;
  apis: number;
  databases: number;
  edges: number;
}

export interface SystemRecord {
  system_id: string;
  name: string;
  source_type: string;
  stats: SystemStats;
  created_at: string;
  graph?: {
    nodes: Array<Record<string, any>>;
    edges: Array<Record<string, any>>;
  };
}

export interface IngestResponseData {
  status: string;
  system_id: string;
  name: string;
  source_type: string;
  stats: SystemStats;
  graph: {
    nodes: Array<Record<string, any>>;
    edges: Array<Record<string, any>>;
  };
}

export interface SimulationRunSummary {
  id: string;
  name: string;
  target_component: string;
  category: string;
  risk_score: number;
  risk_level: string;
  created_at: string;
}

export interface SimulationDetail extends SimulationRunSummary {
  v1_sql: string;
  v2_sql: string;
  results: {
    target_component: string;
    schema_modifications: Record<string, Record<string, Record<string, string>>>;
    impacted_nodes: string[];
    impacted_count: number;
    risk_score: number;
    risk_level: string;
    evidence_paths: Record<string, string[][]>;
    node_details: Record<string, any>;
  };
}

/**
 * Checks backend health
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    if (res.ok) return true;
    const fallback = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
    return fallback.ok;
  } catch {
    return false;
  }
}

export interface SimulateChangePayload {
  project_id?: string;
  target_component: string;
  change_type?: string;
  old_value?: unknown;
  new_value?: unknown;
  v1_sql?: string;
  v2_sql?: string;
  [key: string]: unknown;
}

export type SimulateChangeResponse = SimulationResponse;

/**
 * Runs a schema & blast radius simulation via POST /analysis/simulate
 */
export async function simulateSchemaImpact(
  payload: SimulationRequestPayload | Record<string, any>
): Promise<ApiResponse<SimulationResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/analysis/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMsg = `Server error ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          errorMsg = typeof errorJson.detail === 'string'
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
        }
      } catch {
        // Fallback
      }
      return { data: null, error: errorMsg, status: res.status };
    }

    const data: SimulationResponse = await res.json();
    return { data, error: null, status: res.status };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error or backend unreachable';
    return { data: null, error: errorMsg, status: 500 };
  }
}

/**
 * Backward compatible simulateChange helper
 */
export async function simulateChange(
  payload: SimulateChangePayload
): Promise<ApiResponse<SimulateChangeResponse>> {
  return simulateSchemaImpact({
    target_component: payload.target_component,
    v1_sql: payload.v1_sql,
    v2_sql: payload.v2_sql,
  });
}

/**
 * Utility to fetch default or current graph topology
 */
export async function fetchSystemGraph(): Promise<ApiResponse<BackendGraphData>> {
  const res = await simulateSchemaImpact({ target_component: 'db-users' });
  if (res.error || !res.data) {
    return { data: null, error: res.error || 'Failed to fetch graph' };
  }

  const defaultGraph: BackendGraphData = {
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

  return { data: defaultGraph, error: null };
}

/**
 * Uploads a file (.sql, .json, .yaml, .yml) to POST /ingest/file
 */
export async function ingestFile(
  file: File,
  sourceType: string
): Promise<ApiResponse<IngestResponseData>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);

    const response = await fetch(`${API_BASE_URL}/ingest/file`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        data: null,
        error: data.detail || 'Failed to ingest file',
      };
    }

    return {
      status: response.status,
      data,
      error: null,
    };
  } catch (err: any) {
    return {
      status: 500,
      data: null,
      error: err.message || 'Network error during file ingestion',
    };
  }
}

/**
 * Ingests raw content string to POST /ingest/raw
 */
export async function ingestRaw(
  name: string,
  sourceType: string,
  content: string
): Promise<ApiResponse<IngestResponseData>> {
  try {
    const response = await fetch(`${API_BASE_URL}/ingest/raw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        source_type: sourceType,
        content,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        data: null,
        error: data.detail || 'Failed to ingest raw content',
      };
    }

    return {
      status: response.status,
      data,
      error: null,
    };
  } catch (err: any) {
    return {
      status: 500,
      data: null,
      error: err.message || 'Network error during raw content ingestion',
    };
  }
}

/**
 * Fetches all ingested systems from GET /ingest/systems
 */
export async function fetchSystems(): Promise<ApiResponse<SystemRecord[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/ingest/systems`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        data: null,
        error: data.detail || 'Failed to fetch systems',
      };
    }

    return {
      status: response.status,
      data,
      error: null,
    };
  } catch (err: any) {
    return {
      status: 500,
      data: null,
      error: err.message || 'Network error while fetching systems',
    };
  }
}

/**
 * Fetches specific system by ID from GET /ingest/systems/{systemId}
 */
export async function fetchSystemById(
  systemId: string
): Promise<ApiResponse<SystemRecord>> {
  try {
    const response = await fetch(`${API_BASE_URL}/ingest/systems/${systemId}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        data: null,
        error: data.detail || 'Failed to fetch system details',
      };
    }

    return {
      status: response.status,
      data,
      error: null,
    };
  } catch (err: any) {
    return {
      status: 500,
      data: null,
      error: err.message || 'Network error while fetching system details',
    };
  }
}

/**
 * Fetches past simulation run history from GET /analysis/simulations
 */
export async function fetchSimulationHistory(): Promise<ApiResponse<SimulationRunSummary[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/simulations`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        data: null,
        error: data.detail || 'Failed to fetch simulation history',
      };
    }

    return {
      status: response.status,
      data,
      error: null,
    };
  } catch (err: any) {
    return {
      status: 500,
      data: null,
      error: err.message || 'Network error while fetching simulation history',
    };
  }
}

/**
 * Fetches specific simulation detail by ID from GET /analysis/simulations/{id}
 */
export async function fetchSimulationDetail(
  id: string
): Promise<ApiResponse<SimulationDetail>> {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/simulations/${id}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        data: null,
        error: data.detail || 'Failed to fetch simulation detail',
      };
    }

    return {
      status: response.status,
      data,
      error: null,
    };
  } catch (err: any) {
    return {
      status: 500,
      data: null,
      error: err.message || 'Network error while fetching simulation detail',
    };
  }
}
