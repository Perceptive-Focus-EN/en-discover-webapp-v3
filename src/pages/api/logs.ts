// src/pages/api/logs.ts

import { NextApiRequest, NextApiResponse } from 'next';

interface TimeWindow {
  start: Date;
  end: Date;
}

function validateTimeWindow(timeWindow?: string): TimeWindow {
  if (!timeWindow) {
    return {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    };
  }

  const match = timeWindow.match(/^(\d+)([hdm])$/);
  if (!match) {
    throw new Error('Invalid time window format');
  }

  const [, value, unit] = match;
  const now = new Date();
  let start: Date;

  switch (unit) {
    case 'h':
      start = new Date(now.getTime() - parseInt(value) * 60 * 60 * 1000);
      break;
    case 'd':
      start = new Date(now.getTime() - parseInt(value) * 24 * 60 * 60 * 1000);
      break;
    case 'm':
      start = new Date(now.getTime() - parseInt(value) * 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      throw new Error('Invalid time unit');
  }

  return { start, end: now };
}

async function validateLogsBatch(body: any): Promise<any[]> {
  if (!body || !Array.isArray(body.logs)) {
    throw new Error('Invalid logs batch format');
  }

  return body.logs.map((log: any) => {
    return {
      ...log,
      timestamp: new Date(),
      reference: `${log.category}_${log.component}_${Date.now().toString(36)}`
    };
  });
}

async function processLogsBatch(logs: any[]): Promise<void> {
  try {
    for (const log of logs) {
      // Simulate log processing
      console.log('Processing log:', log);
    }
  } catch (error) {
    throw new Error('Failed to process logs batch');
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'POST') {
      const validatedLogs = await validateLogsBatch(req.body);
      
      try {
        await processLogsBatch(validatedLogs);

        return res.status(200).json({
          success: true,
          message: 'Logs processed and persisted successfully',
          count: validatedLogs.length
        });
      } catch (error) {
        return res.status(500).json({
          error: 'Failed to process logs batch'
        });
      }
    }

    if (req.method === 'GET') {
      const timeWindow = validateTimeWindow(req.query.timeWindow as string);
      // Simulate log retrieval
      const logs: any[] = []; // Replace with actual log retrieval logic

      return res.status(200).json({
        success: true,
        data: logs,
        timeWindow
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      error: 'Method not allowed'
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Error processing logs request'
    });
  }
}
