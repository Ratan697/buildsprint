export interface NavItem {
  name: string;
  href: string;
  iconName: 'Overview' | 'Simulations' | 'Systems' | 'Dependencies' | 'RiskRules' | 'Reports' | 'Settings';
}

export const NAV_ITEMS = [
  { name: 'Overview', href: '/' },
  { name: 'Simulations', href: '/simulations' },
  { name: 'Systems', href: '/systems' },
  { name: 'Dependencies', href: '/dependencies' },
  { name: 'Risk Rules', href: '/risk-rules' },
  { name: 'Reports', href: '/reports' },
  { name: 'Settings', href: '/settings' },
] as const;

export const OVERVIEW_SUMMARY_CARDS = [
  { title: 'Simulations', value: 12, type: 'total' },
  { title: 'High Risk', value: 3, type: 'high' },
  { title: 'Medium Risk', value: 5, type: 'medium' },
  { title: 'Low Risk', value: 4, type: 'low' },
] as const;

export const RECENT_SIMULATIONS = [
  { id: '1', name: 'Update User Service API', risk: 'High', date: '10 mins ago' },
  { id: '2', name: 'Modify Orders Table Schema', risk: 'Medium', date: '1 hour ago' },
  { id: '3', name: 'Change Payment Gateway', risk: 'High', date: '3 hours ago' },
  { id: '4', name: 'Update Environment Variable', risk: 'Low', date: '5 hours ago' },
  { id: '5', name: 'Upgrade Notification Service', risk: 'Medium', date: '1 day ago' },
] as const;

export const RISK_DISTRIBUTION = [
  { label: 'High', count: 3, color: 'bg-red-500' },
  { label: 'Medium', count: 5, color: 'bg-amber-500' },
  { label: 'Low', count: 4, color: 'bg-emerald-500' },
] as const;

export const HOW_IT_WORKS_STEPS = [
  { step: '1', title: 'Simulate Change', desc: 'Define architectural modifications or schema updates.' },
  { step: '2', title: 'Analyze Impact', desc: 'Trace downstream system & API dependencies.' },
  { step: '3', title: 'Assess Risk', desc: 'Calculate blast radius and vulnerability risk scores.' },
  { step: '4', title: 'Get Insights', desc: 'Review actionable evidence logs and safety metrics.' },
] as const;
