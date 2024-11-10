import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { SUBSCRIPTION_PLANS } from '../../../constants/subscriptionPlans';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51MmnePD1nktmyofyjhqmQIZNHmPKZIkU7NHf7P3sRioJAzDamxqyiWypB7RqLsCc2PIXpSnlRWUY4R8Awdlefvvn007QVUa0sQ';

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ userId: decoded.userId });

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: 'User or Stripe customer ID not found' });
    }

    const stripeCustomerId = user.stripeCustomerId;

    switch (req.method) {
      case 'GET':
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          limit: 1,
        });

        if (subscriptions.data.length === 0) {
          return res.status(404).json({ error: 'No active subscription found' });
        }

        res.status(200).json(subscriptions.data[0]);
        break;

      case 'PUT':
        const { subscriptionPlanType }: { subscriptionPlanType: keyof typeof SUBSCRIPTION_PLANS } = req.body;
        const currentSubscription = (await stripe.subscriptions.list({ customer: stripeCustomerId, limit: 1 })).data[0];

        if (!currentSubscription) {
          return res.status(404).json({ error: 'No active subscription found to update' });
        }

        const updatedSubscription = await stripe.subscriptions.update(
          currentSubscription.id,
          {
            items: [{ price: SUBSCRIPTION_PLANS[subscriptionPlanType].stripePriceId }],
          }
        );
        res.status(200).json(updatedSubscription);
        break;

      case 'DELETE':
        const subscriptionToCancel = (await stripe.subscriptions.list({ customer: stripeCustomerId, limit: 1 })).data[0];

        if (!subscriptionToCancel) {
          return res.status(404).json({ error: 'No active subscription found to cancel' });
        }

        await stripe.subscriptions.cancel(subscriptionToCancel.id);
        res.status(200).json({ message: 'Subscription cancelled successfully' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error handling subscription request' });
  }
}