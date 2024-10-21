import React from 'react';
import { Emotion } from './types/emotions';

interface RadarChartProps {
    emotions: Emotion[];
}

const RadarChart: React.FC<RadarChartProps> = ({ emotions }) => {
    const centerX = 50;
    const centerY = 50;
    const radius = 40;

    const getCoordinates = (index: number, total: number) => {
        const angle = (Math.PI * 2 * index) / total;
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        };
    };

    const points = emotions.map((_, index) => getCoordinates(index, emotions.length));

    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <circle cx={centerX} cy={centerY} r={radius} stroke="#E3E3ED" strokeWidth="0.5" fill="none"/>
            <circle cx={centerX} cy={centerY} r={radius * 0.75} stroke="#E3E3ED" strokeWidth="0.5" fill="none"/>
            <circle cx={centerX} cy={centerY} r={radius * 0.5} stroke="#E3E3ED" strokeWidth="0.5" fill="none"/>
            {points.map((point, index) => (
                <line key={index} x1={centerX} y1={centerY} x2={point.x} y2={point.y} stroke="#E3E3ED" strokeWidth="0.5"/>
            ))}
            <path 
                d={emotions.map((emotion, index) => {
                    const point = points[index];
                    const value = (parseInt(emotion.color?.slice(1) || '0', 16) % 100) / 100;
                    return `${index === 0 ? 'M' : 'L'} ${centerX + (point.x - centerX) * value} ${centerY + (point.y - centerY) * value}`;
                }).join(' ') + ' Z'}
                fill="#825EEB" 
                fillOpacity="0.2" 
                stroke="#D7CCF9" 
                strokeWidth="0.5"
            />
            {emotions.map((emotion, index) => {
                const point = points[index];
                const value = (parseInt(emotion.color?.slice(1) || '0', 16) % 100) / 100;
                return (
                    <circle 
                        key={emotion.id}
                        cx={centerX + (point.x - centerX) * value} 
                        cy={centerY + (point.y - centerY) * value} 
                        r="2" 
                        fill={emotion.color || '#CCCCCC'}
                    />
                );
            })}
        </svg>
    );
};

export default RadarChart;
