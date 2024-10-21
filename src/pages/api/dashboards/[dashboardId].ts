// src/pages/api/dashboard/[id].ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { ObjectId } from 'mongodb';
import { DashboardConfig } from '../../../types/Dashboard'; // Import your Dashboard type

const handleDatabaseError = (res: NextApiResponse, error: any, message: string) => {
  console.error(`${message}:`, error);
  res.status(500).json({ error: message });
};

const getDashboard = async (collection: any, id: string, res: NextApiResponse) => {
  try {
    const dashboard = await collection.findOne({ _id: new ObjectId(id) });
    if (dashboard) {
      res.status(200).json(dashboard);
    } else {
      res.status(404).json({ error: 'Dashboard not found' });
    }
  } catch (error) {
    handleDatabaseError(res, error, 'Failed to fetch dashboard');
  }
};

const updateDashboard = async (collection: any, id: string, updatedDashboard: Partial<DashboardConfig>, res: NextApiResponse) => {
  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updatedDashboard, updatedAt: new Date() } }
    );
    if (result.matchedCount > 0) {
      const updated = await collection.findOne({ _id: new ObjectId(id) });
      res.status(200).json(updated);
    } else {
      res.status(404).json({ error: 'Dashboard not found' });
    }
  } catch (error) {
    handleDatabaseError(res, error, 'Failed to update dashboard');
  }
};

const deleteDashboard = async (collection: any, id: string, res: NextApiResponse) => {
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount > 0) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Dashboard not found' });
    }
  } catch (error) {
    handleDatabaseError(res, error, 'Failed to delete dashboard');
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id) || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid dashboard ID' });
  }

  try {
    const { db } = await getCosmosClient();
    const collection = db.collection(COLLECTIONS.DASHBOARDS);

    switch (req.method) {
      case 'GET':
        await getDashboard(collection, id, res);
        break;

      case 'PUT':
        await updateDashboard(collection, id, req.body, res);
        break;

      case 'DELETE':
        await deleteDashboard(collection, id, res);
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    handleDatabaseError(res, error, 'Failed to connect to the database');
  }
}

