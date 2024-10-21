import React, { useState, useEffect, useRef } from 'react';
import { useSpring, animated } from 'react-spring';
import { forceSimulation, forceCollide, forceX, forceY } from 'd3-force';
import { Box } from '@mui/material';
import { SimulationNodeDatum } from 'd3-force';

interface Mood extends SimulationNodeDatum {
    id: number;
    name: string;
    value: number;
    color: string;
    vx: number;
    vy: number;
}

const moods: Mood[] = [
    { id: 1, name: 'Happy', value: 30, color: '#FFC300', vx: 0, vy: 0 },
    { id: 2, name: 'Sad', value: 20, color: '#5DADE2', vx: 0, vy: 0 },
    { id: 3, name: 'Angry', value: 15, color: '#EC7063', vx: 0, vy: 0 },
    { id: 4, name: 'Calm', value: 25, color: '#52BE80', vx: 0, vy: 0 },
    { id: 5, name: 'Excited', value: 10, color: '#FF5733', vx: 0, vy: 0 },
];

const CONTAINER_WIDTH = 200; // Scaled down width
const CONTAINER_HEIGHT = 200; // Scaled down height
const BOUNDARY_PADDING = 10;
const DAMPING = 0.9; // Increased damping for smoother gliding

const Draggables: React.FC = () => {
    const [nodes, setNodes] = useState<Mood[]>(moods);
    const svgRef = useRef<SVGSVGElement>(null);
    const requestRef = useRef<number>();

    const updatePositions = () => {
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
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePositions);
        return () => cancelAnimationFrame(requestRef.current!);
    }, []);

    const handleDrag = (id: number, dx: number, dy: number) => {
        setNodes(prevNodes =>
            prevNodes.map(node => {
                if (node.id === id) {
                    return { ...node, vx: dx * 0.1, vy: dy * 0.1 };
                }
                return node;
            })
        );
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
            const mouseX = e.clientX - rect.left - CONTAINER_WIDTH / 2;
            const mouseY = e.clientY - rect.top - CONTAINER_HEIGHT / 2;
            setNodes(prevNodes =>
                prevNodes.map(node => {
                    const dx = mouseX - (node.x || 0);
                    const dy = mouseY - (node.y || 0);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < node.value * 2) {
                        return { ...node, vx: dx * 0.1, vy: dy * 0.1 };
                    }
                    return node;
                })
            );
        }
    };

    return (
        <Box sx={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, overflow: 'hidden', position: 'relative' }}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`-${CONTAINER_WIDTH / 2} -${CONTAINER_HEIGHT / 2} ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`}
                onMouseMove={handleMouseMove}
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
                    <animated.circle
                        key={node.id}
                        cx={node.x}
                        cy={node.y}
                        r={node.value}
                        fill={node.color}
                        stroke="#fff"
                        strokeWidth={2}
                    />
                ))}
            </svg>
        </Box>
    );
};

export default Draggables;
