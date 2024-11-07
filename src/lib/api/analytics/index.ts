import { getAnalytics } from './getAnalytics';
import { getGlobalStats } from './getGlobalStats';
import { getSystemHealth } from './getSystemHealth';
import { getRegionalData } from './getRegionalData';

export { getAnalytics } from './getAnalytics';
export { getGlobalStats } from './getGlobalStats';
export { getSystemHealth } from './getSystemHealth';
export { getRegionalData } from './getRegionalData';

// You can also export a combined object if you prefer:
export const analyticsApi = {
  getAnalytics,
  getGlobalStats,
  getSystemHealth,
  getRegionalData,
};