import React, { useRef, useEffect } from 'react';
import { styled } from '@mui/material';

const VideoContainer = styled('div')({
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'var(--app-background-color)', // Use CSS variable for background color
});

const VideoElement = styled('video')<{ $scale: number, $offsetX: number, $offsetY: number }>(
    ({ $scale, $offsetX, $offsetY }) => ({
        width: `${$scale}%`,
        height: `${$scale}%`,
        objectFit: 'cover',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(calc(-50% + ${$offsetX}px), calc(-50% + ${$offsetY}px))`,
        '@media (max-width: 600px)': {
            width: '200%',
            height: '200%',
            top: '51%',
            left: '53.5%',
            transform: 'translate(-50%, -50%)',
        },
    })
);

const VideoLogo: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Adjusted values to move the logo towards bottom right
    const scale = 210;  // Increased zoom level
    const offsetX = 8;  // Move left (reveals more black on the right)
    const offsetY = 3; // Move up (reveals more black on the bottom)

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.play().catch(error => {
            console.error('Error playing video:', error);
        });

        return () => {
            video.pause();
        };
    }, []);

    return (
        <VideoContainer>
            <VideoElement
                ref={videoRef}
                src="/01.mp4"
                loop
                muted
                playsInline
                $scale={scale}
                $offsetX={offsetX}
                $offsetY={offsetY}
            />
        </VideoContainer>
    );
};

export default VideoLogo;