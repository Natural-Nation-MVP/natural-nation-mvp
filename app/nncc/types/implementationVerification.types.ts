// Defines the verification status for one NNCC implementation area.
export type NNCCVerificationStatus = 'operational' | 'watch' | 'not_ready';

// Defines a route-level verification item.
export interface NNCCRouteVerificationItem {
  id: string;
  label: string;
  routeKey: string;
  workspace: 'Founder' | 'Knowledge' | 'Build' | 'Operations';
  status: NNCCVerificationStatus;
  evidence: string;
}

// Defines a service or data layer verification item.
export interface NNCCSystemVerificationItem {
  id: string;
  label: string;
  category: 'theme' | 'navigation' | 'service' | 'data' | 'workflow';
  status: NNCCVerificationStatus;
  evidence: string;
}

// Defines the full implementation verification report.
export interface NNCCImplementationVerificationReport {
  routeItems: NNCCRouteVerificationItem[];
  systemItems: NNCCSystemVerificationItem[];
  operationalRoutes: number;
  totalRoutes: number;
  operationalSystems: number;
  totalSystems: number;
  overallPercent: number;
}
