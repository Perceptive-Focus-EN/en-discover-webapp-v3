// src/components/EN/mockData/emotionHistory.ts
import { EmotionName, EmotionId } from '../../Feed/types/Reaction';
import { VOLUME_LEVELS, VolumeLevelId } from '../constants/volume';
import { SOURCE_CATEGORIES } from '../constants/sources';

export interface Emotion {
  id: number;
  emotionName: EmotionName;
  color: string;
  volume: number;
  sources: string[];
  timestamp: string;
  updatedAt: string;
  createdAt: string;
  deletedAt: string | null;
  userId: string;
}

export const EmotionType = [
    { id: 1, emotionName: "EUPHORIC" },
    { id: 2, emotionName: "TRANQUIL" },
    { id: 3, emotionName: "REACTIVE" },
    { id: 4, emotionName: "SORROW" },
    { id: 5, emotionName: "FEAR" },
    { id: 6, emotionName: "DISGUST" },
    { id: 7, emotionName: "SUSPENSE" },
    { id: 8, emotionName: "ENERGY" }
] as const;

export const volumeToOpacity: Record<VolumeLevelId, number> = {
    1: 0.25, // 'A little'
    2: 0.5,  // 'Normal'
    3: 0.75, // 'Enough'
    4: 1,    // 'A lot'
};

export const generateRandomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

export const getRandomElement = <T>(arr: readonly T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

export const generateMockEmotions = (
    startYear: number = 2020,
    endYear: number = 2024,
    entriesPerYear: number = 50
) => {
    const startDate = new Date(`${startYear}-01-01T00:00:00Z`);
    const endDate = new Date(`${endYear}-12-31T23:59:59Z`);
    const mockEmotions: Emotion[] = [];
    
    for (let index = 0; index < entriesPerYear; index++) {
        const randomDate = generateRandomDate(startDate, endDate);
        const emotionType = getRandomElement(EmotionType);
        const volume = getRandomElement(VOLUME_LEVELS).id;
        const sources = [
            getRandomElement(SOURCE_CATEGORIES).name,
            getRandomElement(SOURCE_CATEGORIES).name
        ];
        const color = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${volumeToOpacity[volume]})`;

        const emotion: Emotion = {
            id: index + 1,
            emotionName: emotionType.emotionName as EmotionName,
            sources: sources,
            color: color,
            volume: volume,
            timestamp: randomDate.toISOString(),
            createdAt: randomDate.toISOString(),
            updatedAt: randomDate.toISOString(),
            deletedAt: null,
            userId: '66c6563b7da5013d16f8d8c9'
        };

        mockEmotions.push(emotion);
    }

    return mockEmotions.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
};

export const mockEmotionHistory = generateMockEmotions();

export const generateHistoryForPeriod = (
    startYear: number,
    endYear: number,
    entriesPerYear: number = 50
) => generateMockEmotions(startYear, endYear, entriesPerYear);

export const lastFiveYearsHistory = generateHistoryForPeriod(2019, 2024, 100);
export const year2023History = generateHistoryForPeriod(2023, 2023, 200);
export const customHistory = generateHistoryForPeriod(2020, 2022, 75);

export default mockEmotionHistory;