// src/pages/ImageRenderer/ImageRenderer.tsx
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Box, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { BrokenImage as BrokenImageIcon, Movie as MovieIcon, Description as DocumentIcon } from '@mui/icons-material';

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
    type?: 'image' | 'video' | 'document';
    processingStatus?: string;
    sasToken?: string;
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

const ImageRenderer: React.FC<ImageRendererProps> = ({
    src,
    alt,
    height = '100%',
    width = '100%',
    objectFit = 'cover',
    fallbackText = 'Failed to load media',
    showLoadingIndicator = true,
    onLoad,
    onError,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [imgSrc, setImgSrc] = useState<string>('');

    useEffect(() => {
        // Handle Azure URLs
        if (src && (src.includes('blob.core.windows.net') || src.includes('azurefd.net'))) {
            // Use standard img tag for Azure storage
            setImgSrc(src);
        } else {
            setImgSrc(src);
        }
    }, [src]);

    return (
        <Box 
            sx={{ 
                position: 'relative',
                height,
                width,
                overflow: 'hidden',
                borderRadius: 1,
                bgcolor: 'grey.100'
            }}
        >
            {!hasError && imgSrc && (
                // Use regular img tag for Azure storage
                <img
                    src={imgSrc}
                    alt={alt}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit,
                        display: isLoading ? 'none' : 'block'
                    }}
                    onLoad={() => {
                        setIsLoading(false);
                        onLoad?.();
                    }}
                    onError={(e) => {
                        console.error('Image load error:', {
                            src: imgSrc,
                            error: e
                        });
                        setHasError(true);
                        setIsLoading(false);
                        onError?.(new Error('Failed to load image'));
                    }}
                />
            )}

            {isLoading && showLoadingIndicator && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <CircularProgress size={24} />
                </Box>
            )}

            {hasError && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center'
                    }}
                >
                    <BrokenImageIcon sx={{ fontSize: 40, color: 'error.main' }} />
                    <Typography variant="caption" color="error">
                        {fallbackText}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default ImageRenderer;