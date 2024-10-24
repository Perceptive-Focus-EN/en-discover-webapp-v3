import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../MonitoringSystem/Loggers/logger';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_default_key';  // Replace with your default key for development

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  logger.info(`Received request for user ID: ${decoded.userId}`);

  try {
    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ userId: decoded.userId });

    logger.info(`Fetched user from database: ${JSON.stringify(user)}`);

    if (!user || !user.stripeCustomerId) {
      logger.warn(`User or Stripe customer ID not found for userId: ${decoded.userId}`);
      return res.status(404).json({ error: 'User or Stripe customer ID not found' });
    }

    logger.info(`Stripe customer ID: ${user.stripeCustomerId}`);

    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
    });

    res.status(200).json(invoices.data);
  } catch (error) {
    logger.error(new Error('Error fetching invoices'), { error });
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error fetching invoices' });
  }
}