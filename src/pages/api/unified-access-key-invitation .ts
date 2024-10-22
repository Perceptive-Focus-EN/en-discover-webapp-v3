// pages/api/unified-access-key-invitation.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../config/azureCosmosClient';
import { logger } from '../../utils/ErrorHandling/logger';
import { DatabaseError, ValidationError } from '../../errors/errors';
import { COLLECTIONS } from '../../constants/collections';
import { v4 as uuidv4 } from 'uuid';
import { sendDynamicEmail } from '../../services/emailService';
import { getEmailStyles, defaultTheme, EmailTheme, COMPANY_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from '../../constants/emailConstants';

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
          <p>This invitation will expire in 7 days. If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
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
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, ...invitationData } = req.body;

  try {
    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const invitationsCollection = db.collection(COLLECTIONS.TENANT_INVITATIONS);
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS);

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      logger.warn(`Attempted to invite existing user: ${email}`);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Get tenant name
    const tenant = await tenantsCollection.findOne({ _id: invitationData.ASSOCIATED_TENANT_ID });
    if (!tenant) {
      logger.error(new Error(`Tenant not found: ${invitationData.ASSOCIATED_TENANT_ID}`));
      return res.status(400).json({ error: 'Invalid tenant' });
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
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

    logger.info(`Invitation created and email sent for email: ${email}`, { invitationId, tenantId: invitationData.ASSOCIATED_TENANT_ID });

    res.status(200).json({
      message: 'Invitation sent successfully',
      invitationId,
      _id: result.insertedId.toString() // Return the MongoDB-generated _id as a string
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      logger.error(new Error('Database error in unified access key invitation handler'), { error });
      return res.status(500).json({ error: 'A database error occurred while processing the request' });
    } else if (error instanceof ValidationError) {
      logger.warn('Validation error in unified access key invitation handler:', error);
      return res.status(400).json({ error: 'Invalid input data' });
    } else {
      logger.error(new Error('Unexpected error in unified access key invitation handler'), { error });
      return res.status(500).json({ error: 'An unexpected error occurred while processing the request' });
    }
  }
}