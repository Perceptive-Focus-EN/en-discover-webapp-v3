// src/pages/api/ai/generate-text.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { AIServiceFactory } from '../../../services/ai/AIServiceFactory';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { KeyVaultService } from '../../../services/keyVaultService';
import { logger } from '../../../MonitoringSystem/Loggers/logger';
import { ErrorType } from '@/MonitoringSystem/constants/errors';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { userId } = (req as any).user;
  const { prompt, aiServiceType } = req.body;

  try {
    const apiKey = await KeyVaultService.getApiKey(userId, aiServiceType);
    if (!apiKey) {
      return res.status(400).json({ error: 'API key not found for the specified service' });
    }

    const aiService = AIServiceFactory.createService(aiServiceType, apiKey);
    const generatedText = await aiService.generateText(prompt);

    res.status(200).json({ generatedText });
  } catch (error) {
    // Error handling using your logger
    logger.error(new Error('Error generating text'), ErrorType.GENERATE_TEXT_FAILURE, { userId });
    res.status(500).json({ error: 'Failed to generate text' });
  }
};

export default authMiddleware(handler);
