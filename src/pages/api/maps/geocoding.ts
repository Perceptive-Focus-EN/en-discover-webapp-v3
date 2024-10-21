import type { NextApiRequest, NextApiResponse } from 'next';
import { ServerGeocodingService, GeocodingResult } from '../../../services/serverGeocodingService';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeocodingResult | { error: string }>
) {
  if (req.method === 'GET') {
    const { query } = req.query;
    
    if (typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter must be a string' });
    }

    const result = ServerGeocodingService.getGeocodingResult(query);

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: 'Geocoding result not found' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}