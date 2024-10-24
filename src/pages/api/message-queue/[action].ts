import { NextApiRequest, NextApiResponse } from 'next';
import { MessageQueueService } from '../../../services/MessageQueueService';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiting for queue operations
const rateLimiter = new RateLimiterMemory({
  points: 100,    // Number of operations
  duration: 60    // Per minute
});

const messageQueueService = new MessageQueueService();

type QueueAction = 'send' | 'receive' | 'peek' | 'count';

function isValidAction(action: unknown): action is QueueAction {
  return typeof action === 'string' && ['send', 'receive', 'peek', 'count'].includes(action);
}

async function processMessage(message: any, queueName: string): Promise<void> {
  const processStart = Date.now();
  
  try {
    console.log(`Processing message from queue ${queueName}:`, message);
    // Add your message processing logic here
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'queue',
      'message_processing_time',
      Date.now() - processStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        queueName,
        messageType: message.type || 'unknown'
      }
    );
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'queue',
      'processing_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        queueName,
        errorType: error instanceof Error ? error.name : 'unknown'
      }
    );
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const { action } = req.query;
  const { queueName, message } = req.body;

  try {
    // Rate limiting
    await rateLimiter.consume(req.socket.remoteAddress || 'unknown');

    if (!isValidAction(action)) {
      const appError = monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        'Invalid queue action',
        { action }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    if (!queueName) {
      const appError = monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        'Queue name is required'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    switch (req.method) {
      case 'POST': {
        if (action === 'send') {
          if (!message) {
            const appError = monitoringManager.error.createError(
              'business',
              'VALIDATION_FAILED',
              'Message is required for send action'
            );
            const errorResponse = monitoringManager.error.handleError(appError);
            return res.status(errorResponse.statusCode).json({
              error: errorResponse.userMessage,
              reference: errorResponse.errorReference
            });
          }

          const sendStart = Date.now();
          await messageQueueService.sendMessage(queueName, message);

          monitoringManager.metrics.recordMetric(
            MetricCategory.PERFORMANCE,
            'queue',
            'send_duration',
            Date.now() - sendStart,
            MetricType.HISTOGRAM,
            MetricUnit.MILLISECONDS,
            {
              queueName,
              messageSize: JSON.stringify(message).length
            }
          );

          monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'queue',
            'message_sent',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            { queueName }
          );

          return res.status(200).json({ 
            message: `Message sent to queue: ${queueName}`,
            messageId: message.id || undefined
          });
        }
        break;
      }

      case 'GET': {
        if (action === 'receive') {
          const receiveStart = Date.now();
          let messageCount = 0;

          await messageQueueService.receiveMessages(queueName, async (msg) => {
            messageCount++;
            await processMessage(msg, queueName);
          });

          monitoringManager.metrics.recordMetric(
            MetricCategory.PERFORMANCE,
            'queue',
            'receive_duration',
            Date.now() - receiveStart,
            MetricType.HISTOGRAM,
            MetricUnit.MILLISECONDS,
            {
              queueName,
              messageCount
            }
          );

          monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'queue',
            'messages_received',
            messageCount,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            { queueName }
          );

          return res.status(200).json({
            message: `Received ${messageCount} messages from queue: ${queueName}`
          });
        }
        break;
      }

      default: {
        const appError = monitoringManager.error.createError(
          'business',
          'METHOD_NOT_ALLOWED',
          'Method not allowed',
          { method: req.method }
        );
        const errorResponse = monitoringManager.error.handleError(appError);
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(errorResponse.statusCode).json({
          error: errorResponse.userMessage,
          reference: errorResponse.errorReference
        });
      }
    }

  } catch (error) {
    if (AppError.isAppError(error)) {
      const errorResponse = monitoringManager.error.handleError(error);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const appError = monitoringManager.error.createError(
      'system',
      'QUEUE_OPERATION_FAILED',
      `Failed to process ${action} message queue action`,
      { error, queueName, action }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'queue',
      'operation_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        action,
        queueName,
        errorType: error instanceof Error ? error.name : 'unknown',
        duration: Date.now() - startTime
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}