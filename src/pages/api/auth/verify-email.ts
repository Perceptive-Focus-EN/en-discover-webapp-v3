// src/pages/api/auth/verify-email.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { verifyEmailToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../MonitoringSystem/Loggers/logger';
import { ErrorType } from '@/MonitoringSystem/constants/errors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      logger.warn('Incorrect HTTP method used for email verification');
      return res.status(405).json({ message: 'Method Not Allowed. Use POST for email verification.' });
    }

    const { verificationToken } = req.body;
    if (!verificationToken) {
      logger.warn('Email verification attempted without a token');
      return res.status(400).json({ message: 'Verification token is required.' });
    }

    // Verify the JWT token
    const decodedToken = verifyEmailToken(verificationToken);
    if (!decodedToken) {
      logger.warn(`Invalid or expired verification token: ${verificationToken}`);
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Find user by userId from the decoded token and verificationToken
    const user = await usersCollection.findOne({ 
      userId: decodedToken.userId,
      verificationToken: verificationToken
    });

    if (!user) {
      logger.warn(`No user found for userId: ${decodedToken.userId} with matching verification token`);
      return res.status(400).json({ message: 'Invalid verification token.' });
    }

    if (user.isVerified) {
      logger.info(`User ${decodedToken.userId} is already verified`);
      return res.status(200).json({ message: 'Email is already verified.' });
    }

    // Update user
    try {
      const updateResult = await usersCollection.updateOne(
        { userId: decodedToken.userId },
        { 
          $set: { 
            isVerified: true,
            'onboardingStatus.steps.0.completed': true,
            'onboardingStatus.currentStepIndex': 1
          },
          $unset: { verificationToken: "" }
        }
      );

      logger.info(`Update result: ${JSON.stringify(updateResult)}`);

      if (updateResult.matchedCount === 0) {
        logger.warn(`No user found for update with userId: ${decodedToken.userId}`);
        return res.status(404).json({ message: 'User not found for update.' });
      }

      if (updateResult.modifiedCount === 0) {
        logger.warn(`User found but not modified: ${decodedToken.userId}`);
        return res.status(400).json({ message: 'User found but not modified. Possibly already verified.' });
    }

      logger.info(`Email verified successfully for user: ${decodedToken.userId}`);
      res.status(200).json({ message: 'Email verified successfully. You can now proceed with your account.' });
    } catch (updateError) {
      logger.error(new Error(`Error updating user: ${decodedToken.userId}`), ErrorType.GENERIC, { error: updateError });
      return res.status(500).json({ message: 'Failed to update user. Please try again.' });
    }

  } catch (error) {
    logger.error(new Error('Error in email verification process'), ErrorType.GENERIC, { error });
    res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
}