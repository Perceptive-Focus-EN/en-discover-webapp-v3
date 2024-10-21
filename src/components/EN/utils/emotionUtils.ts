// src/utils/emotionUtils.ts

import { EmotionId } from '../../Feed/types/Reaction';

export enum EmotionName {
  ANGER = 'ANGER',
  FEAR = 'FEAR',
  SADNESS = 'SADNESS',
  DISGUST = 'DISGUST',
  SURPRISE = 'SURPRISE',
  ANTICIPATION = 'ANTICIPATION',
  TRUST = 'TRUST',
  JOY = 'JOY'
}

export const getEmotionNameById = (id: EmotionId): EmotionName => {
  switch (id) {
    case 1: return EmotionName.ANGER;
    case 2: return EmotionName.FEAR;
    case 3: return EmotionName.SADNESS;
    case 4: return EmotionName.DISGUST;
    case 5: return EmotionName.SURPRISE;
    case 6: return EmotionName.ANTICIPATION;
    case 7: return EmotionName.TRUST;
    case 8: return EmotionName.JOY;
    default:
      throw new Error(`Invalid EmotionId: ${id}`);
  }
};