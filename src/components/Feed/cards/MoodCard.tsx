import React from 'react';
import { BaseCard, BaseCardProps } from './BaseCard';

export interface MoodCardProps extends BaseCardProps {
  mood: string;
  moodColor: string;
  moodVolume: string;
}

export const MoodCard: React.FC<MoodCardProps> = (props) => {
  const { mood, moodColor, moodVolume, ...baseProps } = props;

  return (
    <BaseCard {...baseProps}>
      <div className={`p-6 min-h-[200px] rounded-lg bg-gradient-to-b ${moodColor} flex flex-col items-center justify-center`}>
        <img className="w-16 h-16 rounded-full border-4 border-white mb-4" src={baseProps.userAvatar} alt={baseProps.username} />
        <div className="text-center text-white text-xl font-bold font-['Nunito'] leading-relaxed">
          {baseProps.username}<br/>feeling {moodVolume} {mood}
        </div>
      </div>
    </BaseCard>
  );
};