
// src/pages/api/certificate/[action].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { CertificateService } from '../../../services/CertificateService';

const certificateService = new CertificateService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;
  const { domain } = req.body;

  try {
    if (req.method === 'POST') {
      if (action === 'generate') {
        // Generate a certificate for the domain
        await certificateService.generateCertificate(domain);
        return res.status(200).json({ message: `Certificate generated for ${domain}` });
      } else {
        return res.status(400).json({ error: 'Invalid action' });
      }
    } else if (req.method === 'GET') {
      if (action === 'get') {
        // Fetch the certificate for the domain
        const certificate = await certificateService.getCertificate(domain);
        return res.status(200).json({ certificate });
      } else {
        return res.status(400).json({ error: 'Invalid action' });
      }
    } else {
      res.setHeader('Allow', ['POST', 'GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    return res.status(500).json({ error: `Failed to process ${action} certificate action: ${(error as Error).message}` });
  }
}
