import React, { useState } from 'react';
import Image from 'next/image';
import { Box, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { BrokenImage as BrokenImageIcon } from '@mui/icons-material';

interface ImageRendererProps {
    src: string;
    alt: string;
    height?: number | string;
    width?: number | string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    fallbackText?: string;
    showLoadingIndicator?: boolean;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    fallbackSrc?: string;
}

const ImageContainer = styled(Box)(({ theme }) => ({
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
}));

const ErrorContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2),
    color: theme.palette.error.main,
    textAlign: 'center',
}));

export const ImageRenderer: React.FC<ImageRendererProps> = ({
    src,
    alt,
    height = '100%',
    width = '100%',
    objectFit = 'cover',
    fallbackText = 'Failed to load image',
    showLoadingIndicator = true,
    onLoad,
    onError,
    fallbackSrc,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Handle Azure Blob Storage URLs
    const imageUrl = src && src.includes('blob.core.windows.net') ? src : fallbackSrc || '';

    const handleLoadingComplete = () => {
        setIsLoading(false);
        onLoad?.();
    };

    const handleError = (error: Error) => {
        console.error('Image load error:', error);
        setHasError(true);
        setIsLoading(false);
        onError?.(error);
    };

    return (
        <ImageContainer sx={{ height, width }}>
            {!hasError && (
                <Image
                    src={imageUrl}
                    alt={alt}
                    fill
                    style={{ objectFit }}
                    loading="lazy"
                    onLoadingComplete={handleLoadingComplete}
                    onError={() => handleError(new Error('Failed to load image'))}
                />
            )}

            {isLoading && showLoadingIndicator && (
                <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    style={{ transform: 'translate(-50%, -50%)' }}
                >
                    <CircularProgress size={24} />
                </Box>
            )}

            {hasError && (
                <ErrorContainer>
                    <BrokenImageIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="body2" color="error">
                        {fallbackText}
                    </Typography>
                </ErrorContainer>
            )}
        </ImageContainer>
    );
};

export default ImageRenderer;