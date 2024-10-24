import type { NextApiRequest, NextApiResponse } from 'next';
import { DnsService } from '../../../services/DnsService';
import { CertificateService } from '../../../services/CertificateService';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import rbacMiddleware from '../../../middlewares/rbacMiddleware';
import { PERMISSIONS } from '../../../constants/AccessKey/permissions';
import { AccessLevel } from '../../../constants/AccessKey/access_levels';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

const dnsService = new DnsService();
const certificateService = new CertificateService();

const requiredPermissionsForPost = [PERMISSIONS.TENANT_CREATE];
const requiredPermissionsForPut = [PERMISSIONS.TENANT_UPDATE];

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const startTime = Date.now();
  const { id } = req.query;
  const { customDomain } = req.body;
  const user = (req as any).user;

  try {
    if (req.method === 'POST') {
      // Record DNS operation attempt
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'dns',
        'subdomain_creation_attempt',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          tenantId: id as string
        }
      );

      const subdomain = await dnsService.createSubdomain('tenant', id as string);

      // Record success metric
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'dns',
        'subdomain_created',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          tenantId: id as string,
          subdomain
        }
      );

      return res.status(200).json({ subdomain });

    } else if (req.method === 'PUT') {
      // Record custom domain mapping attempt
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'dns',
        'custom_domain_mapping_attempt',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          tenantId: id as string,
          customDomain
        }
      );

      const success = await dnsService.mapCustomDomain(customDomain, id as string);
      
      if (!success) {
        throw monitoringManager.error.createError(
          'business',
          'DNS_MAPPING_FAILED',
          'Failed to map custom domain',
          { customDomain, tenantId: id }
        );
      }

      // Record mapping success
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'dns',
        'custom_domain_mapped',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          tenantId: id as string,
          customDomain
        }
      );

      if (user.accessLevel === AccessLevel.L4) {
        // Record certificate generation attempt
        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'certificate',
          'generation_attempt',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            customDomain,
            tenantId: id as string
          }
        );

        await certificateService.generateCertificate(customDomain);

        // Record certificate success
        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'certificate',
          'generated',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            customDomain,
            tenantId: id as string
          }
        );

        return res.status(200).json({ 
          message: 'Custom domain mapped and certificate generated successfully' 
        });
      }

      return res.status(200).json({ 
        message: 'Custom domain mapped successfully. Certificate generation requires admin access.' 
      });

    } else {
      const appError = monitoringManager.error.createError(
        'business',
        'METHOD_NOT_ALLOWED',
        'Method not allowed',
        { method: req.method }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      res.setHeader('Allow', ['POST', 'PUT']);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

  } catch (error) {
    if (AppError.isAppError(error)) {
      const errorResponse = monitoringManager.error.handleError(error);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const operation = req.method === 'POST' ? 'subdomain_creation' : 'custom_domain_mapping';
    const appError = monitoringManager.error.createError(
      'system',
      'DNS_OPERATION_FAILED',
      `Failed to ${operation.replace('_', ' ')}`,
      { error, tenantId: id, customDomain }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    // Record error metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'dns',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation,
        errorType: error instanceof Error ? error.name : 'unknown',
        tenantId: id as string
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });

  } finally {
    // Record operation duration
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'dns',
      'operation_duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        operation: req.method === 'POST' ? 'subdomain_creation' : 'custom_domain_mapping',
        tenantId: id as string,
        status: res.statusCode.toString()
      }
    );
  }
};

function getRequiredPermissions(req: NextApiRequest) {
  if (req.method === 'POST') {
    return requiredPermissionsForPost;
  } else if (req.method === 'PUT') {
    return requiredPermissionsForPut;
  }
  return [];
}

export default authMiddleware(
  (req, res) => rbacMiddleware(getRequiredPermissions(req))(handler)(req, res)
);