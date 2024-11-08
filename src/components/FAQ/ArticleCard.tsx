// src/components/FAQ/ArticleCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { 
  Card, CardContent, CardActions, Typography, 
  Button, Box, Chip, IconButton, Collapse 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { formatDistance } from 'date-fns';

interface ArticleCardProps {
  id: string;
  question: string;
  answer: string;
  article: string;
  tags: string[];
  searchTerm: string;
  isOpen: boolean;
  onToggle: (id: string, article: string) => void;
  highlightText: (text: string, searchTerm: string) => React.ReactNode;
}

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
  }
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
  borderRadius: 16,
  height: 24,
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.dark,
  '& .MuiChip-label': {
    padding: '0 8px'
  }
}));

const ArticleContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  marginTop: theme.spacing(2),
  '& p': {
    marginBottom: theme.spacing(2)
  }
}));

export const ArticleCard: React.FC<ArticleCardProps> = ({
  id,
  question,
  answer,
  article,
  tags,
  searchTerm,
  isOpen,
  onToggle,
  highlightText
}) => {
  const itemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      <StyledCard>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box display="flex" gap={0.5} flexWrap="wrap">
              {tags.map((tag) => (
                <CategoryChip key={tag} label={tag} size="small" />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatDistance(new Date(), new Date(), { addSuffix: true })}
            </Typography>
          </Box>

          <Box 
            display="flex" 
            alignItems="center" 
            sx={{ cursor: 'pointer' }} 
            onClick={() => onToggle(id, article)}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                flex: 1,
                '& mark': {
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                  padding: '0 4px',
                  borderRadius: '4px',
                }
              }}
            >
              {highlightText(question, searchTerm)}
            </Typography>
            <IconButton 
              size="small" 
              sx={{ 
                transform: isOpen ? 'rotate(45deg)' : 'none', 
                transition: 'transform 0.3s ease' 
              }}
            >
              {isOpen ? <RemoveIcon /> : <AddIcon />}
            </IconButton>
          </Box>

          <Collapse in={isOpen}>
            <Typography variant="body2" sx={{ mt: 2 }}>
              {highlightText(answer, searchTerm)}
            </Typography>
            {isOpen && article && (
              <ArticleContent>
                <Typography variant="body1">
                  {highlightText(article, searchTerm)}
                </Typography>
              </ArticleContent>
            )}
          </Collapse>
        </CardContent>
        
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => onToggle(id, article)}
            sx={{
              background: theme => theme.palette.mode === 'light' 
                ? 'linear-gradient(135deg, #997CEF 0%, #6E43EB 100%)'
                : 'linear-gradient(135deg, #B49AF3 0%, #8E6BEF 100%)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(110, 67, 235, 0.2)',
              }
            }}
          >
            {isOpen ? 'Show Less' : 'Read More'}
          </Button>
        </CardActions>
      </StyledCard>
    </motion.div>
  );
};

export default ArticleCard;