// src/components/EN/mockEmotions.ts
import { EmotionName, EmotionId } from '../Feed/types/Reaction';
import { VOLUME_LEVELS, VolumeLevelId } from './constants/volume';
import { SOURCE_CATEGORIES } from './constants/sources';
// import mockUserId from '../../pages/api/mockEmotionColorMappings';

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

const generateRandomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getRandomElement = <T>(arr: readonly T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

const startDate = new Date('2018-01-01T00:00:00Z');
const endDate = new Date('2023-12-31T23:59:59Z');
const numberOfEntries = 100;

const mockEmotions: Emotion[] = [];
let cumulativePercentile = 0;

for (let index = 0; index < numberOfEntries; index++) {
    if (cumulativePercentile >= 100) break;

    const randomDate = generateRandomDate(startDate, endDate);
    const emotionName = getRandomElement(EmotionType).emotionName;
    const volume = getRandomElement(VOLUME_LEVELS).id;
    const sources = [
        getRandomElement(SOURCE_CATEGORIES).name,
        getRandomElement(SOURCE_CATEGORIES).name
    ];
    const color = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${volumeToOpacity[volume]})`;

    const emotion: Emotion = {
            id: index + 1,
            emotionName: emotionName,
            sources: sources,
            color: color,
            volume: volume,
            timestamp: randomDate.toISOString(),
            createdAt: randomDate.toISOString(),
            updatedAt: randomDate.toISOString(),
            deletedAt: null,
            userId: ''
    };

    mockEmotions.push(emotion);
    cumulativePercentile += 1;
}

export default mockEmotions;