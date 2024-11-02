// File: controllers/settingsController.ts

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

// Add to your types or at the top of settingsController.ts
export interface StaticSettings {
  _id?: string;
  type: 'faq' | 'terms' | 'privacy-policy';
  content: {
    lastUpdated: Date;
    version?: string;
    data: any;
  };
}

const getSettingsCollection = async () => {
  const { db } = await getCosmosClient();
  return db.collection(COLLECTIONS.SETTINGS);
};

const getUserSettings = async (userId: string): Promise<SettingsState | null> => {
  const collection = await getSettingsCollection();
  return await collection.findOne({ userId }) as SettingsState | null;
};

// Add to settingsController.ts
const initializeStaticSettings = async () => {
  const collection = await getSettingsCollection();
  
  // Initialize FAQ if not exists
  const faq = await collection.findOne({ type: 'faq' });
  if (!faq) {
    await collection.insertOne({
      type: 'faq',
      content: {
        lastUpdated: new Date(),
        data: {
          questions: [
            {
              question: "What is ENDiscover?",
              answer: "Default answer..."
            }
          ]
        }
      }
    });
  }

  // Initialize Terms if not exists
  const terms = await collection.findOne({ type: 'terms' });
  if (!terms) {
    await collection.insertOne({
      type: 'terms',
      content: {
        version: "1.0",
        lastUpdated: new Date(),
        data: {
          content: "Default Terms of Service..."
        }
      }
    });
  }

  // Initialize Privacy Policy if not exists
  const privacy = await collection.findOne({ type: 'privacy-policy' });
  if (!privacy) {
    await collection.insertOne({
      type: 'privacy-policy',
      content: {
        version: "1.0",
        lastUpdated: new Date(),
        data: {
          content: "Default Privacy Policy..."
        }
      }
    });
  }
};

// Consolidated endpoint to get all settings at once (for user-specific settings, see below)
// Modify getAllSettings in settingsController.ts
export const getAllSettings = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const settings = await getUserSettings(userId);
    
    // Initialize static settings if they don't exist
    await initializeStaticSettings();
    
    const collection = await getSettingsCollection();
    const [faq, terms, privacyPolicy] = await Promise.all([
      collection.findOne({ type: 'faq' }),
      collection.findOne({ type: 'terms' }),
      collection.findOne({ type: 'privacy-policy' })
    ]);

    const response = {
      notifications: settings?.notifications || {},
      private: settings?.private || {},
      style: settings?.style || {},
      overseerInvites: settings?.overseerInvites || {},
      appRating: settings?.appRating || {
        currentRating: 0,
        feedbackHistory: []
      },
      faq: faq?.content?.data || { questions: [], lastUpdated: new Date() },
      terms: terms?.content?.data || { 
        version: '1.0', 
        lastAccepted: new Date(0), 
        content: '' 
      },
      privacyPolicy: privacyPolicy?.content?.data || { 
        version: '1.0', 
        lastAccepted: new Date(0), 
        content: '' 
      }
    };

    res.status(200).json({
      success: true,
      data: response,
      message: 'Settings retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Function to fetch FAQ settings
export const getFaq = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const collection = await getSettingsCollection();
    const faq = await collection.findOne({ type: 'faq' });
    
    if (!faq) {
      await initializeStaticSettings();
      const newFaq = await collection.findOne({ type: 'faq' });
      res.status(200).json({
        success: true,
        data: newFaq?.content?.data || { questions: [], lastUpdated: new Date() },
        message: 'FAQ retrieved successfully'
      });
    } else {
      res.status(200).json({
        success: true,
        data: faq.content.data,
        message: 'FAQ retrieved successfully'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Function to fetch Terms settings
export const getTerms = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const collection = await getSettingsCollection();
    const terms = await collection.findOne({ type: 'terms' });
    
    if (!terms) {
      await initializeStaticSettings();
      const newTerms = await collection.findOne({ type: 'terms' });
      res.status(200).json({
        success: true,
        data: newTerms?.content?.data || { version: '1.0', lastAccepted: new Date(0), content: '' },
        message: 'Terms retrieved successfully'
      });
    } else {
      res.status(200).json({
        success: true,
        data: terms.content.data,
        message: 'Terms retrieved successfully'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch terms',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Function to fetch Privacy Policy settings
export const getPrivacyPolicy = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const collection = await getSettingsCollection();
    const privacyPolicy = await collection.findOne({ type: 'privacy-policy' });
    
    if (!privacyPolicy) {
      await initializeStaticSettings();
      const newPrivacyPolicy = await collection.findOne({ type: 'privacy-policy' });
      res.status(200).json({
        success: true,
        data: newPrivacyPolicy?.content?.data || { version: '1.0', lastAccepted: new Date(0), content: '' },
        message: 'Privacy policy retrieved successfully'
      });
    } else {
      res.status(200).json({
        success: true,
        data: privacyPolicy.content.data,
        message: 'Privacy policy retrieved successfully'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch privacy policy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Consolidated endpoint to update multiple settings at once
export const updateAllSettings = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const updates = req.body;
    const collection = await getSettingsCollection();

    const updateObj: Record<string, any> = {};
    
    if (updates.notifications) {
      updateObj.notifications = updates.notifications;
    }
    if (updates.private) {
      updateObj.private = updates.private;
    }
    if (updates.style) {
      updateObj.style = updates.style;
    }
    if (updates.overseerInvites) {
      updateObj.overseerInvites = updates.overseerInvites;
    }
    if (updates.appRating) {
      updateObj.appRating = updates.appRating;
    }

    await collection.updateOne(
      { userId },
      { $set: updateObj },
      { upsert: true }
    );

    const updatedSettings = await getUserSettings(userId);

    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Additional functions for managing user-specific settings (similar structure)

export const getNotifications = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const settings = await getUserSettings(userId);
    res.status(200).json({
      success: true,
      data: settings?.notifications || {},
      message: 'Notification settings retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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
    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getPrivateSettings = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const settings = await getUserSettings(userId);
    res.status(200).json({
      success: true,
      data: settings?.private || {},
      message: 'Private settings retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch private settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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
    res.status(200).json({
      success: true,
      message: 'Private settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update private settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getStyleSettings = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const settings = await getUserSettings(userId);
    res.status(200).json({
      success: true,
      data: settings?.style || {},
      message: 'Style settings retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch style settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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
    res.status(200).json({
      success: true,
      message: 'Style settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update style settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getOverseerInvites = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const settings = await getUserSettings(userId);
    res.status(200).json({
      success: true,
      data: settings?.overseerInvites || {},
      message: 'Overseer invites retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overseer invites',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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
    res.status(200).json({
      success: true,
      message: 'Overseer invites updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update overseer invites',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAppRating = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userId = (req as any).user.userId;
    const settings = await getUserSettings(userId);
    res.status(200).json({
      success: true,
      data: settings?.appRating || { currentRating: 0, feedbackHistory: [] },
      message: 'App rating retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch app rating',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

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
    res.status(200).json({
      success: true,
      message: 'App rating submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit app rating',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}