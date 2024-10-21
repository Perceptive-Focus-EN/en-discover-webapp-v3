// src/pages/api/auth/resend-verification.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { generateEmailVerificationToken, setEmailVerificationToken } from '../../../utils/emailUtils';
import { sendVerificationEmail } from '../../../services/emailService';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../utils/ErrorHandling/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.info('Resend verification handler invoked');
  logger.debug('Incoming headers:', req.headers);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const userId = decoded.userId;

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ userId: userId });

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      logger.info(`User already verified: ${userId}`);
      return res.status(400).json({ message: 'User is already verified' });
    }

    const verificationToken = generateEmailVerificationToken({ 
        userId: user.userId,
        email: user.email
    });
    
    // Store the token in Redis
    await setEmailVerificationToken(userId, verificationToken);

    // Update the user document with the verification token
    await usersCollection.updateOne(
      { userId: userId },
      { $set: { verificationToken: verificationToken } }
    );

    await sendVerificationEmail({
      recipientEmail: user.email,
      recipientName: `${user.firstName} ${user.lastName}`,
      additionalData: { verificationToken }
    });

    logger.info(`Verification email resent successfully for user: ${userId}`);
    res.status(200).json({ message: 'Verification email resent successfully' });
  } catch (error) {
    logger.error('Error resending verification email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}