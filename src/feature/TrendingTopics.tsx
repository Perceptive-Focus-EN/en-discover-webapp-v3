// src/components/Feed/TrendingTopics.tsx
import React from 'react';
import { Typography, List, ListItem, ListItemText, Box, Chip, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export const mockTrendingTopics = [
    { topic: '#ClimateChange', count: 1234 },
    { topic: '#TechInnovation', count: 987 },
    { topic: '#HealthAndWellness', count: 876 },
    { topic: '#TravelGoals', count: 765 },
    { topic: '#FoodieFavorites', count: 654 }
];

const TrendingTopics: React.FC = () => {
    const theme = useTheme();
    const topics = mockTrendingTopics;

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                Trending Topics
            </Typography>
            <List dense>
                {topics.map((topic, index) => (
                    <ListItem key={index} disableGutters>
                        <ListItemText 
                            primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                        {topic.topic}
                                    </Typography>
                                    <Chip 
                                        label={`${topic.count}`} 
                                        size="small" 
                                        sx={{ 
                                            backgroundColor: theme.palette.primary.light,
                                            color: theme.palette.primary.contrastText,
                                            fontSize: '0.7rem'
                                        }} 
                                    />
                                </Box>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default TrendingTopics;