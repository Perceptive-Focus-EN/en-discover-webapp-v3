// src/pages/api/metrics.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { redisService } from '../../services/cache/redisService';
import { metricsCollector } from '../../utils/ErrorHandling/MetricsCollector';
import { HTTP_STATUS } from '../../constants/logging';
import { ERROR_MESSAGES } from '../../constants/errorMessages';
import { logger } from '../../utils/ErrorHandling/logger';
import { DEFAULT_METRICS, METRIC_TYPES } from '../../constants/metrics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const incomingMetrics = req.body;
    const timestamp = new Date().toISOString();
    const metricsId = `metrics:${timestamp}`;

    try {
      // Process incoming metrics
      Object.entries(incomingMetrics).forEach(([metricName, metricValue]: [string, any]) => {
        if (metricName in DEFAULT_METRICS) {
          if (metricValue.type === METRIC_TYPES.COUNTER) {
            metricsCollector.increment(metricName as keyof typeof DEFAULT_METRICS, metricValue.value);
          } else if (metricValue.type === METRIC_TYPES.GAUGE) {
            metricsCollector.gauge(metricName as keyof typeof DEFAULT_METRICS, metricValue.value, metricValue.unit);
          } else if (metricValue.type === METRIC_TYPES.HISTOGRAM) {
            metricsCollector.histogram(metricName as keyof typeof DEFAULT_METRICS, metricValue.value, metricValue.unit);
          }
        } else {
          logger.warn(`Received undefined metric: ${metricName}`);
        }
      });

      // Get all metrics from the collector
      const allMetrics = metricsCollector.getMetrics();

      // Store metrics in Redis
      await redisService.setValue(metricsId, JSON.stringify(Object.fromEntries(allMetrics)), 86400); // TTL: 24 hours

      // Update list of metric IDs
      const metricsList = JSON.parse(await redisService.getValue('all_metrics') || '[]');
      metricsList.unshift(metricsId);
      if (metricsList.length > 100) {
        const oldestMetricId = metricsList.pop();
        await redisService.deleteValue(oldestMetricId);
      }
      await redisService.setValue('all_metrics', JSON.stringify(metricsList), 86400); // TTL: 24 hours

      logger.info('Metrics stored successfully');
      metricsCollector.increment(DEFAULT_METRICS.API_CALLS);
      res.status(HTTP_STATUS.OK).json({ message: 'Metrics stored successfully' });
    } catch (err) {
      logger.error('Failed to store metrics:', { error: err });
      metricsCollector.increment(DEFAULT_METRICS.ERROR_COUNT);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.FAILED_TO_STORE_METRICS });
    }
  } else {
    metricsCollector.increment(DEFAULT_METRICS.ERROR_COUNT);
    res.setHeader('Allow', ['POST']);
    res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).end(`Method ${req.method} Not Allowed`);
  }
}