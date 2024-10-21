import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSpring, animated } from 'react-spring';
import { Box, Tooltip, Typography } from '@mui/material';
import { SimulationNodeDatum } from 'd3-force';
import { Emotion } from './types/emotions';
import { EmotionName, EmotionId } from '../Feed/types/Reaction'
import { VOLUME_LEVELS, VolumeLevelId } from './constants/volume';
import { SOURCE_CATEGORIES, SourceCategoryId } from './constants/sources';

interface Mood extends SimulationNodeDatum {
    id: EmotionId;
    name: EmotionName;
    value: number;
    color: string;
    percentage: number;
    volume: VolumeLevelId;
    sources: string[];
    vx: number;
    vy: number;
}

interface PercentileBubblesProps {
    emotions: Emotion[];
}

const CONTAINER_WIDTH = 900;
const CONTAINER_HEIGHT = 450;
const BOUNDARY_PADDING = 10;
const DAMPING = 0.9;
const MAX_BUBBLE_SIZE = 80;
const MIN_BUBBLE_SIZE = 20;

const PercentileBubbles: React.FC<PercentileBubblesProps> = ({ emotions }) => {
    const [nodes, setNodes] = useState<Mood[]>([]);
    const svgRef = useRef<SVGSVGElement>(null);
    const requestRef = useRef<number>();
    const [draggingNode, setDraggingNode] = useState<Mood | null>(null);

    useEffect(() => {
        // Calculate total volume and percentages
        const totalVolume = emotions.reduce((sum, emotion) => sum + (emotion.volume || 0), 0);
        
        // Convert emotions to Mood objects with percentages
        const initialNodes: Mood[] = emotions.map(emotion => {
            const volumeLevel = VOLUME_LEVELS.find(level => level.id === emotion.volume) || VOLUME_LEVELS[0];
            const percentage = totalVolume > 0 ? ((emotion.volume || 0) / totalVolume) * 100 : 0;
            const value = MIN_BUBBLE_SIZE + (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE) * (percentage / 100);
            return {
                id: emotion.id,
                name: emotion.emotionName,
                value: value,
                color: emotion.color,
                percentage: percentage,
                volume: volumeLevel.id,
                sources: emotion.sources,
                vx: 0,
                vy: 0,
                x: Math.random() * CONTAINER_WIDTH - CONTAINER_WIDTH / 2,
                y: Math.random() * CONTAINER_HEIGHT - CONTAINER_HEIGHT / 2,
            };
        });
        setNodes(initialNodes);
    }, [emotions]);

    const updatePositions = useCallback(() => {
        setNodes(prevNodes => {
            return prevNodes.map(node => {
                let newX = (node.x || 0) + node.vx;
                let newY = (node.y || 0) + node.vy;

                // Wall collision
                if (newX - node.value <= -CONTAINER_WIDTH / 2 + BOUNDARY_PADDING || 
                        newX + node.value >= CONTAINER_WIDTH / 2 - BOUNDARY_PADDING) {
                    node.vx *= -DAMPING;
                    newX = Math.max(-CONTAINER_WIDTH / 2 + node.value + BOUNDARY_PADDING, 
                                                    Math.min(CONTAINER_WIDTH / 2 - node.value - BOUNDARY_PADDING, newX));
                }
                if (newY - node.value <= -CONTAINER_HEIGHT / 2 + BOUNDARY_PADDING || 
                        newY + node.value >= CONTAINER_HEIGHT / 2 - BOUNDARY_PADDING) {
                    node.vy *= -DAMPING;
                    newY = Math.max(-CONTAINER_HEIGHT / 2 + node.value + BOUNDARY_PADDING, 
                                                    Math.min(CONTAINER_HEIGHT / 2 - node.value - BOUNDARY_PADDING, newY));
                }

                // Node collision
                prevNodes.forEach(otherNode => {
                    if (node.id !== otherNode.id) {
                        const dx = (otherNode.x || 0) - newX;
                        const dy = (otherNode.y || 0) - newY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const minDistance = node.value + otherNode.value;

                        if (distance < minDistance) {
                            const angle = Math.atan2(dy, dx);
                            const targetX = newX + Math.cos(angle) * minDistance;
                            const targetY = newY + Math.sin(angle) * minDistance;
                            const ax = (targetX - (otherNode.x || 0)) * 0.05;
                            const ay = (targetY - (otherNode.y || 0)) * 0.05;

                            node.vx -= ax;
                            node.vy -= ay;
                            otherNode.vx += ax;
                            otherNode.vy += ay;
                        }
                    }
                });

                node.vx *= DAMPING;
                node.vy *= DAMPING;

                return { ...node, x: newX, y: newY };
            });
        });

        requestRef.current = requestAnimationFrame(updatePositions);
    }, []);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePositions);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [updatePositions]);

    const handleMouseDown = useCallback((node: Mood) => setDraggingNode(node), []);
    const handleMouseUp = useCallback(() => setDraggingNode(null), []);

    const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (draggingNode) {
            const rect = svgRef.current?.getBoundingClientRect();
            if (rect) {
                const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
                const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
                const mouseX = clientX - rect.left - CONTAINER_WIDTH / 2;
                const mouseY = clientY - rect.top - CONTAINER_HEIGHT / 2;
                setNodes(prevNodes =>
                    prevNodes.map(node => {
                        if (node.id === draggingNode.id) {
                            return { ...node, x: mouseX, y: mouseY, vx: 0, vy: 0 };
                        }
                        return node;
                    })
                );
            }
        }
    }, [draggingNode]);

    return (
        <Box sx={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, overflow: 'hidden', position: 'relative' }}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`-${CONTAINER_WIDTH / 2} -${CONTAINER_HEIGHT / 2} ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`}
                onMouseMove={handleMouseMove}
                onTouchMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchEnd={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <rect
                    x={-CONTAINER_WIDTH / 2}
                    y={-CONTAINER_HEIGHT / 2}
                    width={CONTAINER_WIDTH}
                    height={CONTAINER_HEIGHT}
                    fill="none"
                    rx="15"
                    ry="15"
                />
                {nodes.map((node: Mood) => (
                    <Tooltip 
                        key={node.id} 
                        title={
                            <React.Fragment>
                                <Typography color="inherit">{node.name}</Typography>
                                <Typography color="inherit">Volume: {VOLUME_LEVELS.find(level => level.id === node.volume)?.name}</Typography>
                                <Typography color="inherit">
                                    Sources: {node.sources.join(', ')}
                                </Typography>
                                <Typography color="inherit">{node.percentage.toFixed(2)}%</Typography>
                            </React.Fragment>
                        } 
                        arrow
                    >
                        <animated.g>
                            <animated.circle
                                cx={node.x}
                                cy={node.y}
                                r={node.value}
                                fill={node.color}
                                stroke="#fff"
                                strokeWidth={2}
                                onMouseDown={() => handleMouseDown(node)}
                                onTouchStart={() => handleMouseDown(node)}
                                style={{ 
                                    cursor: 'pointer',
                                    filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))',
                                }}
                            />
                            <animated.text
                                x={node.x}
                                y={node.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#fff"
                                fontSize={node.value / 3}
                                fontWeight="bold"
                            >
                                {node.percentage.toFixed(0)}%
                            </animated.text>
                        </animated.g>
                    </Tooltip>
                ))}
            </svg>
        </Box>
    );
};

export default PercentileBubbles;