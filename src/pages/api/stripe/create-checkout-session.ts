import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../MonitoringSystem/Loggers/logger';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51MmnePD1nktmyofyjhqmQIZNHmPKZIkU7NHf7P3sRioJAzDamxqyiWypB7RqLsCc2PIXpSnlRWUY4R8Awdlefvvn007QVUa0sQ';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded || typeof decoded !== 'object' || !decoded.userId || !decoded.email) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { subscriptionPlanType, successUrl, cancelUrl, stripePriceId } = req.body;

    if (!stripePriceId) {
      return res.status(400).json({ error: 'No Stripe Price ID provided' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: decoded.email,
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    logger.error(new Error('Error creating checkout session'), { error });
    res.status(500).json({ error: 'Error creating checkout session' });
  }
}