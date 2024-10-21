// src/pages/api/auth/user/[userId]/dashboards.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createDashboard, getUserDashboards } from '@/lib/dashboardDbOperations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    switch (req.method) {
      case 'POST':
        if (!req.body.tenantId) {
          return res.status(400).json({ error: 'tenantId is required' });
        }
        const newDashboard = await createDashboard(userId, req.body.tenantId, req.body);
        res.status(201).json(newDashboard);
        break;

      case 'GET':
        const userDashboards = await getUserDashboards(userId);
        res.status(200).json(userDashboards);
        break;

      default:
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Database operation error:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
}