// src/lib/api_s/moodboard/moodHistoryApi.ts

import axiosInstance from '../../axiosSetup';
import * as authManager from '../../../utils/TokenManagement/authManager';
import { AxiosError } from 'axios';
import { MoodHistoryItem, MoodHistoryQuery, TimeRange } from '../../../components/EN/types/moodHistory';

import { emotionMappingsApi } from '../reactions/emotionMappings';

export async function fetchMoodHistory(query: MoodHistoryQuery): Promise<MoodHistoryItem[]> {
    try {
        const token = authManager.getAccessToken();
        if (!token || authManager.isTokenExpired(token)) {
            await authManager.refreshTokens();
        }

        const [moodHistoryResponse, emotionMappingsResponse] = await Promise.all([
            axiosInstance.get<any[]>('/api/moodboard/moodHistory', { params: query }),
            emotionMappingsApi.getEmotionMappings(query.emotion as unknown as string)
        ]);

        const emotionColorMap = emotionMappingsResponse.reduce((acc: { [x: string]: any; }, emotion: { emotionName: string | number; color: any; }) => {
            acc[emotion.emotionName] = emotion.color;
            return acc;
        }, {} as Record<string, string>);

        // Transform the data
        const transformedData: MoodHistoryItem[] = moodHistoryResponse.data.map(item => ({
            userId: item.userId,
            emotionName: item.emotionName,
            date: new Date(item.date.$date).toISOString(), // Convert MongoDB date to ISO string
            volume: item.volume,
            sources: item.sources,
            color: emotionColorMap[item.emotionId] || '#CCCCCC', // Add color information
            source: item.source, // Add source information
            emotionId: item.emotionId, // Add emotionId information
            timeStamp: item.timeStamp, // Add timeStamp information
            tenantId: item.tenantId, // Add tenantId information
            createdAt: new Date(item.createdAt.$date).toISOString(), // Add createdAt information
            updatedAt: new Date(item.updatedAt.$date).toISOString(), // Add updatedAt information
            deletedAt: item.deletedAt ? new Date(item.deletedAt.$date).toISOString() : null, // Add deletedAt information
        }));

        return transformedData;
    } catch (error) {
        if (error instanceof AxiosError) {
            if (error.response?.status === 401) {
                await authManager.logout();
                throw new Error('Authentication failed. Please log in again.');
            }
            throw new Error(error.response?.data?.error || 'An error occurred while fetching mood history.');
        }
        throw new Error('An unexpected error occurred while fetching mood history.');
    }
}

export { getStartDate } from '../../../utils/dateUtil';