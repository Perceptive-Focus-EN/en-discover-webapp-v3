import { EmotionName, EmotionId, EmotionType } from '@/feature/types/Reaction';
import { parseToRgba, lighten, darken, rgba } from 'color2k';

// Base color for emotion
const BASE_COLOR = '#FFD700'; // Example base color

// Function to get color based on emotion
export const getEmotionColor = (emotion: EmotionId): string => {
  const baseColor = parseToRgba(BASE_COLOR);
  return emotion % 2 === 0 ? lighten(rgba(...baseColor), 0.1) : darken(rgba(...baseColor), 0.1);
};

// Function to get full emotion config
export const getEmotionConfig = (emotionName: EmotionName): {
  label: string;
  color: string;
  animate: { scale: number; rotate?: number };
} => {
const emotion: { id: EmotionId; emotionName: EmotionName } | undefined = EmotionType.find(
    (e: { emotionName: EmotionName }) => e.emotionName === emotionName
);
  if (!emotion) return { label: emotionName, color: BASE_COLOR, animate: { scale: 1 } };

  const color = getEmotionColor(emotion.id);
  return {
    label: emotionName.charAt(0) + emotionName.slice(1).toLowerCase(),
    color,
    animate: { scale: 1.2 + emotion.id * 0.05, rotate: emotion.id % 2 === 0 ? 10 : -10 },
  };
};
