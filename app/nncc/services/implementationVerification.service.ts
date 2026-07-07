import {
  nnccRouteVerificationItems,
  nnccSystemVerificationItems,
} from '../data/nncc.implementationVerification.seed';
import type { NNCCImplementationVerificationReport } from '../types/implementationVerification.types';

// Returns the full implementation verification report for NNCC.
export function getImplementationVerificationReport(): NNCCImplementationVerificationReport {
  const operationalRoutes = nnccRouteVerificationItems.filter(
    (item) => item.status === 'operational',
  ).length;
  const operationalSystems = nnccSystemVerificationItems.filter(
    (item) => item.status === 'operational',
  ).length;
  const totalItems = nnccRouteVerificationItems.length + nnccSystemVerificationItems.length;
  const operationalItems = operationalRoutes + operationalSystems;

  return {
    routeItems: nnccRouteVerificationItems,
    systemItems: nnccSystemVerificationItems,
    operationalRoutes,
    totalRoutes: nnccRouteVerificationItems.length,
    operationalSystems,
    totalSystems: nnccSystemVerificationItems.length,
    overallPercent: Math.round((operationalItems / totalItems) * 100),
  };
}
