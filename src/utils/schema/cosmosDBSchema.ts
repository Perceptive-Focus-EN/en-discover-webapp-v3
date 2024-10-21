import { z } from 'zod';

export const CosmosDBSchema = z.object({
  tenantId: z.string(),
  entity: z.object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    version: z.number(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    metadata: z.object({
      industry: z.string(),
      size: z.string(),
      tags: z.array(z.string()),
      customFields: z.record(z.unknown())
    })
  }),
  timeSeries: z.array(z.object({
    timestamp: z.string().datetime(),
    metrics: z.record(z.unknown())
  })),
  latestAnalysis: z.object({
    timestamp: z.string().datetime(),
    summary: z.string(),
    keyInsights: z.array(z.string()),
    charts: z.record(z.unknown()).nullable(),
    insights: z.record(z.unknown()).nullable(),
    statistics: z.record(z.unknown()).nullable()
  }),
  aiFeatures: z.object({
    embeddingVector: z.array(z.number()),
    lastProcessedTimestamp: z.string().datetime(),
    modelVersion: z.string()
  }),
  ttl: z.number()
});

export type CosmosDBDocument = z.infer<typeof CosmosDBSchema>;