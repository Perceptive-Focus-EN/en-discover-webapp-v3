import React, { useState } from 'react';
import { Typography, Skeleton } from '@mui/material';
import { BaseCard, BaseCardProps } from './BaseCard';

export interface PhotoCardProps extends BaseCardProps {
  photos: string | string[];
  caption?: string;
}

export const PhotoCard: React.FC<PhotoCardProps> = (props) => {
  const { photos, caption, ...baseProps } = props;
  const photoArray = Array.isArray(photos) ? photos : [photos];
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <BaseCard {...baseProps}>
      <div style={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
        {!imageLoaded && !imageError && (
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height="100%" 
            animation="wave"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        )}
        <img
          src={photoArray[0]}
          alt={caption || 'User photo'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: imageLoaded && !imageError ? 'block' : 'none',
          }}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            console.error('Error loading image:', photoArray[0]);
            setImageError(true);
          }}
        />
        {imageError && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'grey.300',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Image not available
            </Typography>
          </div>
        )}
        {photoArray.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}>
            {photoArray.map((_, index) => (
              <div
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  margin: '0 0.5rem',
                  borderRadius: '50%',
                  backgroundColor: index === 0 ? 'white' : 'rgba(255, 255, 255, 0.5)',
                }}
              />
            ))}
          </div>
        )}
      </div>
      {caption && (
        <Typography style={{ padding: '1.5rem 2rem', fontSize: 14, color: 'text.secondary' }}>
          {caption}
        </Typography>
      )}
    </BaseCard>
  );
};