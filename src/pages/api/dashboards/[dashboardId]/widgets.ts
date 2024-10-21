import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { ObjectId } from 'mongodb';
import { WidgetInstance } from '@/types/Widgets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { dashboardId } = req.query;
  const { method } = req;

  if (typeof dashboardId !== 'string') {
    return res.status(400).json({ error: 'Invalid dashboard ID' });
  }

  const { db } = await getCosmosClient();
  const collection = db.collection<WidgetInstance>(COLLECTIONS.WIDGETS);

  try {
    switch (method) {
      case 'GET':
        const widgets = await collection.find({ dashboardId }).toArray();
        res.status(200).json(widgets);
        break;

      case 'POST':
        const widgetData: Partial<WidgetInstance> = req.body;
        if (!widgetData.type || !widgetData.name) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const newWidget: WidgetInstance = {
          ...widgetData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as WidgetInstance;

        await collection.insertOne(newWidget);
        res.status(201).json(newWidget);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in widget operation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}