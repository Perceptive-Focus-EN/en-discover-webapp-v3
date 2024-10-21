// pages/api/settings/[category]/[action].ts

import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '../../../../middlewares/authMiddleware';
import * as settingsController from '../../controllers/settingsController';

type SettingsHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void;

const handlers: Record<string, Record<string, SettingsHandler>> = {
  notifications: {
    get: settingsController.getNotifications,
    update: settingsController.updateNotifications,
  },
  private: {
    get: settingsController.getPrivateSettings,
    update: settingsController.updatePrivateSettings,
  },
  'overseer-invites': {
    get: settingsController.getOverseerInvites,
    update: settingsController.updateOverseerInvites,
  },
  style: {
    get: settingsController.getStyleSettings,
    update: settingsController.updateStyleSettings,
  },
  faq: {
    get: settingsController.getFaq,
  },
  'rate-app': {
    submit: settingsController.submitAppRating,
  },
    feedback: {
    // submit: settingsController.submitFeedback,
  },
  terms: {
    get: settingsController.getTerms,
  },
  privacy: {
    get: settingsController.getPrivacyPolicy,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const { category, action } = req.query;

  if (
    typeof category !== 'string' ||
    typeof action !== 'string' ||
    !handlers[category] ||
    !handlers[category][action]
  ) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  await handlers[category][action](req, res);
};

export default authMiddleware(handler as any);