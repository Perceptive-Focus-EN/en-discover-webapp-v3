// src/pages/api/dashboards/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { DashboardConfig } from '../../../types/Dashboard';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { db } = await getCosmosClient();
    const collection = db.collection<DashboardConfig>(COLLECTIONS.DASHBOARDS);

    // Optional query parameters
    const { limit = '10', skip = '0', search = '' } = req.query;

    // Parse limit and skip to integers
    const parsedLimit = parseInt(limit as string, 10);
    const parsedSkip = parseInt(skip as string, 10);

    // Validate limit and skip
    if (isNaN(parsedLimit) || isNaN(parsedSkip) || parsedLimit < 1 || parsedSkip < 0) {
      return res.status(400).json({ error: 'Invalid limit or skip parameter' });
    }

    // Create a query object
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    // Fetch dashboards
    const dashboards = await collection
      .find(query)
      .skip(parsedSkip)
      .limit(parsedLimit)
      .toArray();

    // Get total count for pagination
    const totalCount = await collection.countDocuments(query);

    res.status(200).json({
      dashboards,
      totalCount,
      currentPage: Math.floor(parsedSkip / parsedLimit) + 1,
      totalPages: Math.ceil(totalCount / parsedLimit),
    });
  } catch (error) {
    console.error('Failed to fetch dashboards:', error);
    res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
}