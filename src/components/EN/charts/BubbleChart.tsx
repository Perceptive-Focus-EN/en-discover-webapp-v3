import React, { useEffect, useRef, useState, useCallback } from 'react';
import Box from '@mui/material/Box';

interface BubbleProps {
    color: string;
    size: number;
    left: number;
    top: number;
}

const Bubble: React.FC<BubbleProps> = ({ color, size, left, top }) => (
    <Box
        sx={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            background: `linear-gradient(to bottom, ${color}, ${color}dd)`,
            boxShadow: 2,
            border: '2px solid rgba(255, 255, 255, 0.1)',
            left: left,
            top: top,
            animation: 'float 5s ease-in-out infinite',
            '@keyframes float': {
                '0%': { transform: 'translate(0, 0)' },
                '25%': { transform: 'translate(10px, -10px)' },
                '50%': { transform: 'translate(-10px, 10px)' },
                '75%': { transform: 'translate(10px, 10px)' },
                '100%': { transform: 'translate(0, 0)' },
            },
        }}
    />
);

interface BubbleData {
    color: string;
    size: number;
    position: { left: number; top: number };
    velocity: { x: number; y: number };
}

const getRandomPosition = (existingBubbles: BubbleData[], size: number, max: number) => {
    let position;
    let overlapping;

    do {
        overlapping = false;
        position = {
            left: Math.floor(Math.random() * (max - size)),
            top: Math.floor(Math.random() * (max - size)),
        };

        for (let bubble of existingBubbles) {
            const dx = bubble.position.left - position.left;
            const dy = bubble.position.top - position.top;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < (bubble.size + size) / 2) {
                overlapping = true;
                break;
            }
        }
    } while (overlapping);

    return position;
};

const getRandomVelocity = () => (Math.random() - 0.5) * 3;

const GRAVITY = 0.3;
const BOUNCE_DAMPING = 0.9;
const MIN_VELOCITY = 1;

const handleCollision = (bubble1: BubbleData, bubble2: BubbleData) => {
    const dx = bubble2.position.left - bubble1.position.left;
    const dy = bubble2.position.top - bubble1.position.top;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = (bubble1.size + bubble2.size) / 2;

    if (distance < minDistance) {
        const angle = Math.atan2(dy, dx);
        const mass1 = bubble1.size;
        const mass2 = bubble2.size;

        const u1 = bubble1.velocity;
        const u2 = bubble2.velocity;

        const v1 = {
            x: ((u1.x * (mass1 - mass2) + 2 * mass2 * u2.x) / (mass1 + mass2)),
            y: ((u1.y * (mass1 - mass2) + 2 * mass2 * u2.y) / (mass1 + mass2)),
        };

        const v2 = {
            x: ((u2.x * (mass2 - mass1) + 2 * mass1 * u1.x) / (mass1 + mass2)),
            y: ((u2.y * (mass2 - mass1) + 2 * mass1 * u1.y) / (mass1 + mass2)),
        };

        bubble1.velocity = { x: v1.x, y: v1.y };
        bubble2.velocity = { x: v2.x, y: v2.y };

        // Adjust positions to prevent overlap
        const overlap = minDistance - distance;
        const adjustX = Math.cos(angle) * overlap / 2;
        const adjustY = Math.sin(angle) * overlap / 2;

        bubble1.position.left -= adjustX;
        bubble1.position.top -= adjustY;
        bubble2.position.left += adjustX;
        bubble2.position.top += adjustY;
    }
};

const BubbleChart: React.FC = () => {
    const containerSize = 200;
    const initialBubbles: BubbleData[] = [
        { color: "#60a5fa", size: 80, position: { left: 0, top: 0 }, velocity: { x: 0, y: 0 } },
        { color: "#ef4444", size: 60, position: { left: 0, top: 0 }, velocity: { x: 0, y: 0 } },
        { color: "#22c55e", size: 40, position: { left: 0, top: 0 }, velocity: { x: 0, y: 0 } },
        { color: "#f97316", size: 50, position: { left: 0, top: 0 }, velocity: { x: 0, y: 0 } },
        { color: "#8b5cf6", size: 70, position: { left: 0, top: 0 }, velocity: { x: 0, y: 0 } },
    ];

    const containerRef = useRef<HTMLDivElement>(null);
    const [bubbles, setBubbles] = useState<BubbleData[]>(() =>
        initialBubbles.map((bubble, index, allBubbles) => ({
            ...bubble,
            position: getRandomPosition(allBubbles.slice(0, index), bubble.size, containerSize),
            velocity: { x: getRandomVelocity(), y: getRandomVelocity() },
        }))
    );

    const handleCollisionCallback = useCallback(handleCollision, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setBubbles((prevBubbles) => {
                const updatedBubbles = prevBubbles.map((bubble) => {
                    let { left, top } = bubble.position;
                    let { x, y } = bubble.velocity;

                    y += GRAVITY;

                    left += x;
                    top += y;

                    if (left <= 0) {
                        left = 0;
                        x = -x * BOUNCE_DAMPING;
                    } else if (left >= containerSize - bubble.size) {
                        left = containerSize - bubble.size;
                        x = -x * BOUNCE_DAMPING;
                    }

                    if (top <= 0) {
                        top = 0;
                        y = -y * BOUNCE_DAMPING;
                    } else if (top >= containerSize - bubble.size) {
                        top = containerSize - bubble.size;
                        y = -y * BOUNCE_DAMPING;
                        if (Math.abs(y) < MIN_VELOCITY) y = -getRandomVelocity();
                    }

                    return {
                        ...bubble,
                        position: { left, top },
                        velocity: { x, y },
                    };
                });

                for (let i = 0; i < updatedBubbles.length; i++) {
                    for (let j = i + 1; j < updatedBubbles.length; j++) {
                        handleCollisionCallback(updatedBubbles[i], updatedBubbles[j]);
                    }
                }

                return updatedBubbles;
            });
        }, 30);

        return () => clearInterval(interval);
    }, [handleCollisionCallback]);

    return (
        <Box ref={containerRef} sx={{ position: 'relative', width: 200, height: 200, overflow: 'hidden' }}>
            {bubbles.map((bubble, index) => (
                <Bubble
                    key={index}
                    color={bubble.color}
                    size={bubble.size}
                    left={bubble.position.left}
                    top={bubble.position.top}
                />
            ))}
        </Box>
    );
};

export default BubbleChart;
