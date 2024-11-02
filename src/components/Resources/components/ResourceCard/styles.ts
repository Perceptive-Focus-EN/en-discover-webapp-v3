// src/components/Resources/components/ResourceCard/styles.ts
import { styled } from '@mui/material/styles';
import { Card, CardMedia, Chip, Typography } from '@mui/material';

export const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '24px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
  }
}));


export const StyledCardMedia = styled(CardMedia)(({ theme }) => ({
  height: 250,
    width: '100%',
    position: 'relative',
  objectFit: 'cover'
}));


export const CategoryChip = styled(Chip)(({ theme }) => ({
  borderRadius: '24px',
  backgroundColor: 'rgba(124, 58, 237, 0.1)',
  color: theme.palette.primary.main,
  fontWeight: 'bold',
  margin: theme.spacing(0, 0.5)
}));

export const ReadTimeChip = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 'bold',
  fontSize: '14px'
}));