// controllers/settingsController.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import {
  SettingsState,
  NotificationSettings,
  PrivateSettings,
  StyleSettings,
  OverseerInviteSettings,
  FaqSettings,
  AppRatingSettings,
  TermsSettings,
  PrivacyPolicySettings
} from '../../../types/Settings/interfaces';
import { FeedbackItem } from '../../../types/Settings/interfaces';

const getSettingsCollection = async () => {
  const { db } = await getCosmosClient();
  return db.collection(COLLECTIONS.SETTINGS);
};

const getUserSettings = async (userId: string): Promise<SettingsState | null> => {
  const collection = await getSettingsCollection();
  return await collection.findOne({ userId }) as SettingsState | null;
};

export const getNotifications = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const settings = await getUserSettings(userId);
    res.status(200).json(settings?.notifications || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
};

export const updateNotifications = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const updatedSettings: NotificationSettings = req.body;
    const collection = await getSettingsCollection();
    await collection.updateOne(
      { userId },
      { $set: { notifications: updatedSettings } },
      { upsert: true }
    );
    res.status(200).json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
};

export const getPrivateSettings = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const settings = await getUserSettings(userId);
    res.status(200).json(settings?.private || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch private settings' });
  }
};

export const updatePrivateSettings = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const updatedSettings: PrivateSettings = req.body;
    const collection = await getSettingsCollection();
    await collection.updateOne(
      { userId },
      { $set: { private: updatedSettings } },
      { upsert: true }
    );
    res.status(200).json({ message: 'Private settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update private settings' });
  }
};

export const getStyleSettings = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const settings = await getUserSettings(userId);
    res.status(200).json(settings?.style || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch style settings' });
  }
};

export const updateStyleSettings = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const updatedSettings: StyleSettings = req.body;
    const collection = await getSettingsCollection();
    await collection.updateOne(
      { userId },
      { $set: { style: updatedSettings } },
      { upsert: true }
    );
    res.status(200).json({ message: 'Style settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update style settings' });
  }
};

export const getOverseerInvites = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const settings = await getUserSettings(userId);
    res.status(200).json(settings?.overseerInvites || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overseer invite settings' });
  }
};

export const updateOverseerInvites = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const updatedSettings: OverseerInviteSettings = req.body;
    const collection = await getSettingsCollection();
    await collection.updateOne(
      { userId },
      { $set: { overseerInvites: updatedSettings } },
      { upsert: true }
    );
    res.status(200).json({ message: 'Overseer invite settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update overseer invite settings' });
  }
};

export const getFaq = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const collection = await getSettingsCollection();
    const faq = await collection.findOne({ type: 'faq' }) as FaqSettings | null;
    res.status(200).json(faq || { questions: [], lastUpdated: new Date() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQ' });
  }
};

export const submitAppRating = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const { rating, feedback }: { rating: number; feedback: string } = req.body;
    
    const newFeedbackItem: FeedbackItem = {
      rating,
      feedback,
      date: new Date()
    };

    const collection = await getSettingsCollection();
    await collection.updateOne(
      { userId },
      { 
        $set: { 'appRating.currentRating': rating },
        $push: { 
          'appRating.feedbackHistory': {
            $each: [newFeedbackItem]
          } as any
        }
      },
      { upsert: true }
    );
    res.status(200).json({ message: 'App rating submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit app rating' });
  }
};

export const getTerms = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const collection = await getSettingsCollection();
    const terms = await collection.findOne({ type: 'terms' }) as TermsSettings | null;
    res.status(200).json(terms || { version: '1.0', lastAccepted: new Date(0), content: '' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch terms' });
  }
};

export const getPrivacyPolicy = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const collection = await getSettingsCollection();
    const privacyPolicy = await collection.findOne({ type: 'privacyPolicy' }) as PrivacyPolicySettings | null;
    res.status(200).json(privacyPolicy || { version: '1.0', lastAccepted: new Date(0), content: '' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch privacy policy' });
  }
};