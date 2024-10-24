import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../config/azureCosmosClient';
import { COLLECTIONS } from '../../constants/collections';
import { v4 as uuidv4 } from 'uuid';
import { sendDynamicEmail } from '../../services/emailService';
import { getEmailStyles, defaultTheme, EmailTheme, COMPANY_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from '../../constants/emailConstants';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

const invitationEmailTemplate = {
  subject: `Invitation to Join ${COMPANY_NAME}`,
  getHtml: (recipientName: string, additionalData: any, theme: EmailTheme) => {
    const { invitationLink, tenantName } = additionalData;
    const styles = getEmailStyles(theme);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to Join ${COMPANY_NAME}</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to ${COMPANY_NAME}!</h1>
          <p>Hello${recipientName ? ` ${recipientName}` : ''},</p>
          <p>You've been invited to join the ${tenantName} tenant on our platform.</p>
          <p>To complete your registration and join the tenant, please click the button below:</p>
          <p>
            <a href="${invitationLink}" class="button">Accept Invitation</a>
          </p>
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p>${invitationLink}</p>
          <p>This invitation will expire in 7 days. If you have any questions or need assistance, please don't hesitate to contact our support t
          <div class="footer">
            <p>Best regards,<br>The ${COMPANY_NAME} Team</p>
            <p>Support: ${SUPPORT_EMAIL} | ${SUPPORT_PHONE}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    const appError = monitoringManager.error.createError(
      'business',
      'METHOD_NOT_ALLOWED',
      'Method not allowed',
      { method: req.method }
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }

  const { email, ...invitationData } = req.body;

  try {
    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const invitationsCollection = db.collection(COLLECTIONS.TENANT_INVITATIONS);
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS);

    // Check existing user
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'invitation',
        'duplicate_attempt',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { email }
      );

      const appError = monitoringManager.error.createError(
        'business',
        'USER_EXISTS',
        'User already exists',
        { email }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    // Verify tenant
    const tenant = await tenantsCollection.findOne({ _id: invitationData.ASSOCIATED_TENANT_ID });
    if (!tenant) {
      const appError = monitoringManager.error.createError(
        'business',
        'TENANT_NOT_FOUND',
        'Invalid tenant',
        { tenantId: invitationData.ASSOCIATED_TENANT_ID }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    // Create invitation
    const invitationId = uuidv4();
    const invitation = {
      invitationId,
      email,
      tenantId: invitationData.ASSOCIATED_TENANT_ID,
      accountType: invitationData.ACCOUNT_TYPE,
      accessLevel: invitationData.ACCESS_LEVEL,
      title: invitationData.TITLE,
      subscriptionType: invitationData.SUBSCRIPTION_TYPE,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING'
    };

    const result = await invitationsCollection.insertOne(invitation);

    // Send invitation email
    const invitationLink = `${process.env.NEXT_PUBLIC_API_URL}/register?invitation=${invitationId}`;
    await sendDynamicEmail(
      "invitationEmail",
      {
        recipientEmail: email,
        recipientName: '',
        additionalData: {
          invitationLink,
          tenantName: tenant.name
        }
      },
      defaultTheme
    );

    // Record success metrics
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'invitation',
      'created',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        email,
        tenantId: invitationData.ASSOCIATED_TENANT_ID,
        accountType: invitationData.ACCOUNT_TYPE,
        accessLevel: invitationData.ACCESS_LEVEL
      }
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'email',
      'invitation_sent',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        email,
        tenantId: invitationData.ASSOCIATED_TENANT_ID,
        type: 'invitation'
      }
    );

    return res.status(200).json({
      message: 'Invitation sent successfully',
      invitationId,
      _id: result.insertedId.toString()
    });

  } catch (error) {
    if (AppError.isAppError(error)) {
      const errorResponse = monitoringManager.error.handleError(error);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const appError = monitoringManager.error.createError(
      'system',
      'OPERATION_FAILED',
      'Failed to process invitation request',
      { error, email }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'invitation',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'create_invitation',
        errorType: error.name || 'unknown',
        email
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}