export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  nodeType: 'service' | 'api' | 'database' | 'external';
  impacted?: boolean;
  isSource?: boolean;
  status?: string;
  dependencyCount?: number;
}

export interface DemoGraphNode {
  id: string;
  type: 'customNode';
  position: { x: number; y: number };
  data: GraphNodeData;
}

export interface DemoGraphEdge {
  id: string;
  source: string;
  target: string;
  impacted?: boolean;
  animated?: boolean;
}

export const INITIAL_DEMO_NODES: DemoGraphNode[] = [
  {
    id: 'frontend',
    type: 'customNode',
    position: { x: 300, y: 20 },
    data: {
      label: 'Frontend App',
      nodeType: 'external',
      dependencyCount: 1,
      status: 'Active',
    },
  },
  {
    id: 'checkout-api',
    type: 'customNode',
    position: { x: 300, y: 130 },
    data: {
      label: 'Checkout API',
      nodeType: 'api',
      dependencyCount: 2,
      status: 'Active',
    },
  },
  {
    id: 'order-service',
    type: 'customNode',
    position: { x: 150, y: 250 },
    data: {
      label: 'Order Service',
      nodeType: 'service',
      dependencyCount: 2,
      status: 'Active',
    },
  },
  {
    id: 'user-service',
    type: 'customNode',
    position: { x: 450, y: 250 },
    data: {
      label: 'User Service',
      nodeType: 'service',
      dependencyCount: 1,
      status: 'Active',
    },
  },
  {
    id: 'payment-service',
    type: 'customNode',
    position: { x: 150, y: 370 },
    data: {
      label: 'Payment Service',
      nodeType: 'service',
      dependencyCount: 1,
      status: 'Active',
    },
  },
  {
    id: 'postgres-db',
    type: 'customNode',
    position: { x: 450, y: 370 },
    data: {
      label: 'PostgreSQL DB (users.customer_id)',
      nodeType: 'database',
      dependencyCount: 0,
      status: 'Modified',
    },
  },
  {
    id: 'payment-gateway',
    type: 'customNode',
    position: { x: 150, y: 490 },
    data: {
      label: 'Stripe Payment Gateway',
      nodeType: 'external',
      dependencyCount: 0,
      status: 'Active',
    },
  },
];

export const INITIAL_DEMO_EDGES: DemoGraphEdge[] = [
  { id: 'e-fe-co', source: 'frontend', target: 'checkout-api' },
  { id: 'e-co-ord', source: 'checkout-api', target: 'order-service' },
  { id: 'e-co-usr', source: 'checkout-api', target: 'user-service' },
  { id: 'e-ord-pay', source: 'order-service', target: 'payment-service' },
  { id: 'e-usr-db', source: 'user-service', target: 'postgres-db' },
  { id: 'e-pay-gw', source: 'payment-service', target: 'payment-gateway' },
];

export const SIMULATED_IMPACT_NODE_IDS = [
  'postgres-db',
  'user-service',
  'order-service',
  'checkout-api',
  'frontend',
];

export const SIMULATION_IMPACT_METRICS = {
  riskScore: 86,
  riskLevel: 'CRITICAL',
  componentsAffected: 5,
  apisAffected: 2,
  databasesAffected: 1,
  externalDependencies: 1,
};
