import type { NextApiRequest, NextApiResponse } from 'next';
import { DnsService } from '../../../services/DnsService';
import { CertificateService } from '../../../services/CertificateService';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import rbacMiddleware from '../../../middlewares/rbacMiddleware';
import { PERMISSIONS } from '../../../constants/AccessKey/permissions'; // Import the permission constants
import { AccessLevel } from '../../../constants/AccessKey/access_levels'; // Import the access level constants

const dnsService = new DnsService();
const certificateService = new CertificateService();

// RBAC permissions for this route
const requiredPermissionsForPost = [PERMISSIONS.TENANT_CREATE];
const requiredPermissionsForPut = [PERMISSIONS.TENANT_UPDATE];

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;
  const { customDomain } = req.body;
  const user = (req as any).user;

  if (req.method === 'POST') {
    try {
      const subdomain = await dnsService.createSubdomain('tenant', id as string);
      res.status(200).json({ subdomain });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create subdomain' });
    }
  } else if (req.method === 'PUT') {
    try {
      const success = await dnsService.mapCustomDomain(customDomain, id as string);
      if (success) {
        // Only allow certificate generation for admin users
        if (user.accessLevel === AccessLevel.L4) {
        await certificateService.generateCertificate(customDomain);
          res.status(200).json({ message: 'Custom domain mapped and certificate generated successfully' });
        } else {
          res.status(200).json({ message: 'Custom domain mapped successfully. Certificate generation requires admin access.' });
        }
      } else {
        res.status(400).json({ error: 'Failed to map custom domain' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to map custom domain' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

// Check for the required permissions based on the HTTP method before applying the middleware.
function getRequiredPermissions(req: NextApiRequest) {
  if (req.method === 'POST') {
    return requiredPermissionsForPost;
  } else if (req.method === 'PUT') {
    return requiredPermissionsForPut;
  }
  return [];
}

// Apply auth and RBAC middleware
export default authMiddleware(
  (req, res) => rbacMiddleware(getRequiredPermissions(req))(handler)(req, res)
);
