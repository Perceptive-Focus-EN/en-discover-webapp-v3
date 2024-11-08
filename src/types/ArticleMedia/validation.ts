// src/types/ArticleMedia/validation.ts
import { z } from 'zod';
import { ResourceStatus, ResourceVisibility } from './resources';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SystemError } from '@/MonitoringSystem/constants/errors';

export interface ValidationResult {
    isValid: boolean;
    errors?: string[];
    failedFields?: string[];
}

const ResourceSchema = z.object({
    // ... your schema definition
});

export const validateResource = async (data: unknown): Promise<ValidationResult> => {
    try {
        const result = ResourceSchema.safeParse(data);
        
        if (!result.success) {
            const errors = result.error.errors.map(err => 
                `${err.path.join('.')}: ${err.message}`
            );
            
            const failedFields = [...new Set(result.error.errors.map(err => 
                err.path[0].toString()
            ))];

            monitoringManager.logger.warn('Resource validation failed', {
                errors,
                failedFields,
                data: {
                    title: (data as any).title,
                    category: (data as any).category
                }
            });

            return {
                isValid: false,
                errors,
                failedFields
            };
        }

        return { isValid: true };
    } catch (error) {
        monitoringManager.logger.error(
            error instanceof Error ? error : new Error('Validation error'),
            SystemError.VALIDATION_FAILED,
            {
                data: {
                    title: (data as any).title,
                    category: (data as any).category
                }
            }
        );

        return {
            isValid: false,
            errors: ['Invalid resource data format'],
            failedFields: ['unknown']
        };
    }
};