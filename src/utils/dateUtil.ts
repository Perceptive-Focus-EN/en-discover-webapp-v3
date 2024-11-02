// src/utils/dateUtils.ts

import { TimeRange } from '../components/EN/types/moodHistory';

export function getStartDate(timeRange: TimeRange): Date {
  const now = new Date();
  switch (timeRange) {
    case 'day':
      return new Date(now.setDate(now.getDate() - 1));
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case 'lifetime':
      return new Date(0);
    default:
      return new Date(now.setDate(now.getDate() - 7));
  }
}

