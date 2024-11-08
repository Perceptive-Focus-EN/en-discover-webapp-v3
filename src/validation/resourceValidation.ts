// src/utils/validation/resourceValidation.ts
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { z } from 'zod';

const ResourceSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    type: z.enum(['image', 'video', 'document']),
    metadata: z.record(z.any()).optional(),
    fileUrl: z.string().url(),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    tags: z.array(z.string()).optional()
});

export type ResourceData = z.infer<typeof ResourceSchema>;

export async function validateResourceData(data: any): Promise<ResourceData | null> {
    try {
        return await ResourceSchema.parseAsync(data);
    } catch (error) {
        monitoringManager.logger.warn('Resource validation failed', {
            data,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return null;
    }
}