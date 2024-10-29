// src/pages/api/uploads/video.ts
import { ServiceBusClient } from '@azure/service-bus';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { ErrorType, SystemError } from '@/MonitoringSystem/constants/errors';

const serviceBusClient = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING
  ? new ServiceBusClient(process.env.AZURE_SERVICE_BUS_CONNECTION_STRING)
  : null;

  
const serviceBusQueueName = process.env.AZURE_SERVICE_BUS_QUEUE_NAME || 'videoProcessing';

export async function queueVideoProcessing(url: string, requestId: string): Promise<boolean> {
  if (!serviceBusClient) {
    monitoringManager.logger.warn('Service Bus not configured', {
      type: 'SERVICE_BUS_MISSING',
      detail: 'Video processing unavailable'
    });
    return false;
  }

  try {
    const sender = serviceBusClient.createSender(serviceBusQueueName);
    
    await sender.sendMessages({
      body: {
        url,
        requestId,
        timestamp: new Date().toISOString()
      }
    });

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'video',
      'queued',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { requestId }
    );

    return true;
  } catch (error) {
    monitoringManager.logger.error(
      new Error(SystemError.QUEUE_VIDEO_FAILED.toString()),
      SystemError.QUEUE_VIDEO_FAILED as ErrorType,
      {
        detail: 'Failed to queue video',
        error
      }
    );
    return false;
  }
}