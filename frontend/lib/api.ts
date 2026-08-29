import { BACKEND_URL } from './config';
import { SimulationRequestPayload, SimulationResponse, BackendGraphData } from './types';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Checks backend health
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/`, { method: 'GET' });
    return res.ok;
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
  payload: SimulationRequestPayload
): Promise<ApiResponse<SimulationResponse>> {
  try {
    const res = await fetch(`${BACKEND_URL}/analysis/simulate`, {
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
        // Fallback to generic message
      }
      return { data: null, error: errorMsg };
    }

    const data: SimulationResponse = await res.json();
    return { data, error: null };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error or backend unreachable';
    return { data: null, error: errorMsg };
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
