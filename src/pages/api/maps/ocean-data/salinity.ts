import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type SalinityResponse = {
  salinity: number;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SalinityResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { lat, lon } = req.query;

  if (typeof lat !== 'string' || typeof lon !== 'string') {
    return res.status(400).json({ error: 'Latitude and longitude must be provided as strings' });
  }

  try {
    const response = await axios.get(
      `https://www.ncei.noaa.gov/erddap/griddap/woa18_decav_s00_04.json?s_an[(0):1:(0)][(0.0):1:(0.0)][(${lat}):1:(${lat})][(${lon}):1:(${lon})]`
    );

    const salinity = response.data.table.rows[0][3];

    if (typeof salinity !== 'number' || isNaN(salinity)) {
      throw new Error('Invalid salinity data received');
    }

    res.status(200).json({ salinity: salinity });
  } catch (error) {
    console.error('Error fetching salinity data:', error);
    res.status(500).json({ error: 'Failed to fetch salinity data' });
  }
}