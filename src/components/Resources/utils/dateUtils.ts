// src/components/Resources/utils/dateUtils.ts
import { format, formatDistance, parseISO, isValid } from 'date-fns';

export interface DateFormatOptions {
  format?: 'full' | 'relative' | 'short' | 'compact';
  includeTime?: boolean;
  timezone?: string;
}

export const formatDate = (
  date: string | Date,
  options: DateFormatOptions = { format: 'full', includeTime: false }
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      console.error('Invalid date provided:', date);
      return 'Invalid date';
    }

    switch (options.format) {
      case 'relative':
        return formatDistance(dateObj, new Date(), { addSuffix: true });
      
      case 'short':
        return format(dateObj, options.includeTime ? 'MMM d, yyyy HH:mm' : 'MMM d, yyyy');
      
      case 'compact':
        return format(dateObj, options.includeTime ? 'dd/MM/yy HH:mm' : 'dd/MM/yy');
      
      case 'full':
      default:
        return format(
          dateObj,
          options.includeTime 
            ? 'MMMM d, yyyy \'at\' HH:mm'
            : 'MMMM d, yyyy'
        );
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const getDateRangeForFilter = (range: 'day' | 'week' | 'month' | 'year' | 'all'): {
  start: string;
  end: string;
} => {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case 'day':
      start.setDate(start.getDate() - 1);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(2000); // Or any reasonable start date
      break;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
};

export const isDateInRange = (
  date: string | Date,
  range: { start: string | Date; end: string | Date }
): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const startObj = typeof range.start === 'string' ? parseISO(range.start) : range.start;
  const endObj = typeof range.end === 'string' ? parseISO(range.end) : range.end;

  return dateObj >= startObj && dateObj <= endObj;
};

export const groupDatesByPeriod = (
  dates: string[],
  period: 'day' | 'week' | 'month'
): Record<string, string[]> => {
  return dates.reduce((acc, date) => {
    const dateObj = parseISO(date);
    let key: string;

    switch (period) {
      case 'day':
        key = format(dateObj, 'yyyy-MM-dd');
        break;
      case 'week':
        key = `Week ${format(dateObj, 'w, yyyy')}`;
        break;
      case 'month':
        key = format(dateObj, 'MMMM yyyy');
        break;
    }

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(date);
    return acc;
  }, {} as Record<string, string[]>);
};