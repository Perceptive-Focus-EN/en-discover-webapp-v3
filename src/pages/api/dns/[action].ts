// src/pages/api/dns/[action].ts (Example API Route)

import { NextApiRequest, NextApiResponse } from 'next';
import { DnsService } from '../../../services/DnsService'; // This is safe to use server-side

const dnsService = new DnsService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { tenantName, tenantId } = req.body;
    try {
      const subdomain = await dnsService.createSubdomain(tenantName, tenantId);
      res.status(200).json({ subdomain });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create subdomain' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
