// src/pages/api/insights.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../config/azureCosmosClient';
import { MongoClient, Db } from 'mongodb';

interface PerformanceMetrics {
  avgResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  timestamp: Date;
}

interface ResourceUsage {
  resourceName: string;
  usagePercentage: number;
  timestamp: Date;
}

interface InsightsResponse {
  avgResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  resourceUsage: Array<{ name: string; usage: number }>;
}

// Simple in-memory cache
let cachedInsights: InsightsResponse | null = null;
let lastCacheTime: number = 0;
const CACHE_TTL = 60000; // 1 minute

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InsightsResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Check cache
  if (cachedInsights && Date.now() - lastCacheTime < CACHE_TTL) {
    return res.status(200).json(cachedInsights);
  }

  let client: MongoClient | null = null;

  try {
    const clientOrDb = await getCosmosClient();
    let db: Db;

    if (clientOrDb instanceof MongoClient) {
      client = clientOrDb;
      db = (clientOrDb as MongoClient).db(process.env.COSMOS_DATABASE_NAME) as Db;
    } else {
      db = (clientOrDb as { db: Db }).db;
    }

    // Fetch performance metrics
    const performanceMetrics = await db.collection<PerformanceMetrics>('performance_metrics')
      .findOne({}, { sort: { timestamp: -1 } });

    // Fetch resource usage data
    const resourceUsage = await db.collection<ResourceUsage>('resource_usage')
      .find({})
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    if (!performanceMetrics) {
      throw new Error('No performance metrics found');
    }

    if (resourceUsage.length === 0) {
      throw new Error('No resource usage data found');
    }

    const response: InsightsResponse = {
      avgResponseTime: performanceMetrics.avgResponseTime,
      requestsPerSecond: performanceMetrics.requestsPerSecond,
      errorRate: performanceMetrics.errorRate,
      resourceUsage: resourceUsage.map(item => ({
        name: item.resourceName,
        usage: item.usagePercentage
      }))
    };

    // Update cache
    cachedInsights = response;
    lastCacheTime = Date.now();

    res.status(200).json(response);
  } catch (error) {
    console.error('Failed to fetch insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  } finally {
    if (client) {
      await client.close();
    }
  }
}