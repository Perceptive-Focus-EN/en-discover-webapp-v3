import { NextApiRequest, NextApiResponse } from 'next';
import { emotionAnalyzer } from '../../services/EmotionAnalyzer';
import { logger } from '../../utils/ErrorHandling/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId, currentTenantId } = req.query;

  if (!userId || !currentTenantId) {
    return res.status(400).json({ message: 'Missing userId or currentTenantId' });
  }

  try {
    const startDate = "2023-05-01"; // You might want to make these configurable
    const endDate = "2023-06-01";

    const recentEntries = await emotionAnalyzer.getRecentMoodEntries(userId as string, currentTenantId as string);
    const emotionFrequency = await emotionAnalyzer.getEmotionFrequency(userId as string, currentTenantId as string, startDate, endDate);
    const avgIntensity = await emotionAnalyzer.getAverageEmotionIntensity(userId as string, currentTenantId as string);
    const emotionTriggers = await emotionAnalyzer.getEmotionTriggers(userId as string, currentTenantId as string);
    const emotionTrends = await emotionAnalyzer.getEmotionTrends(userId as string, currentTenantId as string);

    res.status(200).json({
      recentEntries,
      emotionFrequency,
      avgIntensity,
      emotionTriggers,
      emotionTrends
    });
  } catch (error) {
    logger.error("Error analyzing emotions:", { userId, currentTenantId, error });
    res.status(500).json({ message: 'Internal Server Error' });
  }
}