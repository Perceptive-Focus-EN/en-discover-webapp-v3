// src/services/ai/PromptBuilderService.ts
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { LogLevel, LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';
import { SystemContext } from '@/MonitoringSystem/types/logging';
import { 
  SystemError,
  BusinessError
} from '@/MonitoringSystem/constants/errors';

interface PromptSystemContext extends SystemContext {
  component: string;
}

const SYSTEM_CONTEXT: PromptSystemContext = {
  component: 'PromptBuilderService',
  systemId: process.env.SYSTEM_ID || 'prompt-builder',
  systemName: 'PromptBuilderService',
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development',
  version: process.env.SYSTEM_VERSION || '1.0',
  metadata: {
    service: 'prompt-building'
  }
};

export class PromptBuilderService {
  private static instance: PromptBuilderService;
  private logger = monitoringManager.logger;
  
  private constructor() {
    this.logger.info('PromptBuilderService initialized', {
      category: LogCategory.SYSTEM,
      pattern: LOG_PATTERNS.SYSTEM,
      metadata: SYSTEM_CONTEXT.metadata
    });
  }
  
  public static getInstance(): PromptBuilderService {
    if (!PromptBuilderService.instance) {
      PromptBuilderService.instance = new PromptBuilderService();
    }
    return PromptBuilderService.instance;
  }

  public buildPrompt(userInput: string, context: string[] = []): string {
    const startTime = Date.now();
    try {
      this.validateInputs(userInput, context);

      const systemMessage = this.getSystemMessage();
      const contextString = this.formatContext(context);
      const formattedUserInput = this.formatUserInput(userInput);

      const fullPrompt = `${systemMessage}\n\n${contextString}\n\n${formattedUserInput}`.trim();

      this.recordPromptMetrics(fullPrompt, startTime, context);

      if (process.env.NODE_ENV === 'development') {
        this.logger.debug('Prompt built successfully', {
          category: LogCategory.BUSINESS,
          pattern: LOG_PATTERNS.BUSINESS,
          metadata: {
            promptLength: fullPrompt.length,
            contextSize: context.length,
            duration: Date.now() - startTime
          }
        });
      }

      return fullPrompt;
    } catch (error) {
      this.handlePromptError(error, startTime, userInput);
      throw error;
    }
  }

  private validateInputs(userInput: string, context: string[]): void {
    if (!userInput || typeof userInput !== 'string') {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'User input must be a non-empty string',
        { 
          metadata: {
            component: SYSTEM_CONTEXT.component,
            inputType: typeof userInput
          }
        }
      );
    }

    if (!Array.isArray(context)) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Context must be an array',
        { 
          metadata: {
            component: SYSTEM_CONTEXT.component,
            contextType: typeof context
          }
        }
      );
    }
  }

  private getSystemMessage(): string {
    return `You are a helpful AI assistant. Please provide clear and concise responses.`;
  }

  private formatContext(context: string[]): string {
    if (!context.length) return '';
    return `Previous context:\n${context.join('\n')}`;
  }

  private formatUserInput(input: string): string {
    return `User: ${input.trim()}`;
  }

  private recordPromptMetrics(
    prompt: string,
    startTime: number,
    context: string[]
  ): void {
    const duration = Date.now() - startTime;

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'prompt',
      'building_duration',
      duration,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        promptLength: prompt.length,
        contextSize: context.length,
        component: SYSTEM_CONTEXT.component
      }
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'prompt',
      'generation',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        promptLength: prompt.length,
        contextSize: context.length,
        hasContext: context.length > 0,
        component: SYSTEM_CONTEXT.component
      }
    );
  }

  private handlePromptError(error: unknown, startTime: number, userInput: string): void {
    const duration = Date.now() - startTime;

    this.logger.error(new Error('Failed to build prompt'), SystemError.PROCESSING_CHUNK_FAILED, {
      category: LogCategory.SYSTEM,
      pattern: LOG_PATTERNS.SYSTEM,
      metadata: {
        error: error instanceof Error ? error.message : 'unknown',
        duration,
        inputLength: userInput.length,
        component: SYSTEM_CONTEXT.component
      }
    });

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'prompt',
      'building_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        error: error instanceof Error ? error.message : 'unknown',
        duration,
        inputLength: userInput.length,
        component: SYSTEM_CONTEXT.component
      }
    );

    if (!(error instanceof Error)) {
      throw monitoringManager.error.createError(
        'system',
        SystemError.PROCESSING_CHUNK_FAILED,
        'Unknown error in prompt building',
        { 
          metadata: {
            component: SYSTEM_CONTEXT.component,
            duration,
            inputLength: userInput.length
          }
        }
      );
    }
  }

  public async destroy(): Promise<void> {
    try {
      await monitoringManager.flush();
      this.logger.info('PromptBuilderService destroyed', {
        category: LogCategory.SYSTEM,
        pattern: LOG_PATTERNS.SYSTEM,
        metadata: {
          component: SYSTEM_CONTEXT.component
        }
      });
    } catch (error) {
      throw monitoringManager.error.createError(
        'system',
        SystemError.LOG_FLUSH_FAILED,
        'Failed to flush logs during service destruction',
        { 
          metadata: {
            component: SYSTEM_CONTEXT.component,
            error
          }
        }
      );
    }
  }
}

export const promptBuilderService = PromptBuilderService.getInstance();