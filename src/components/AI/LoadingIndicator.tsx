// src/components/AI/LoadingIndicator.tsx

import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAIAssistant } from '@/contexts/AIAssistantContext';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.2;
  }
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
`;

const LoadingWrapper = styled.div<{ color: string }>`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PulseCircle = styled.div<{ color: string, size: number, delay: number }>`
  position: absolute;
  width: ${props => props.size}%;
  height: ${props => props.size}%;
  border-radius: 50%;
  background-color: ${props => props.color};
  opacity: 0.6;
  animation: ${pulse} 2s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;

const LoadingIndicator: React.FC = () => {
  const { state } = useAIAssistant();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: { x: number; y: number; size: number; speed: number }[] = [];

    const createParticles = () => {
      const particleCount = 30;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 0.5 + 0.1,
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = `rgba(${rgbColor}, ${state.isLoading ? 0.1 : 0})`;
      particles.forEach((particle) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        particle.y -= particle.speed;
        if (particle.y < 0) {
          particle.y = canvas.height;
        }
      });

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    createParticles();
    drawParticles();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state.isLoading, state.buttonColor]);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
  };

  const rgbColor = hexToRgb(state.buttonColor);

  return (
    <LoadingWrapper color={`rgba(${rgbColor}, ${state.isLoading ? 0.2 : 0})`}>
      <canvas ref={canvasRef} width="300" height="300" style={{ position: 'absolute', top: 0, left: 0 }} />
      <PulseCircle color={`rgba(${rgbColor}, ${state.isLoading ? 0.1 : 0})`} size={90} delay={0} />
      <PulseCircle color={`rgba(${rgbColor}, ${state.isLoading ? 0.1 : 0})`} size={100} delay={0.5} />
      <PulseCircle color={`rgba(${rgbColor}, ${state.isLoading ? 0.1 : 0})`} size={110} delay={1} />
    </LoadingWrapper>
  );
};

export default LoadingIndicator;