import React from 'react';
import { Grid, Chip } from '@mui/material';

interface InsightChipsProps {
  insights: string[];
}

const InsightChips: React.FC<InsightChipsProps> = ({ insights }) => {
  return (
    <Grid container spacing={1}>
      {insights.map((insight, index) => (
        <Grid item key={index}>
          <Chip label={insight} sx={{ m: 0.5 }} />
        </Grid>
      ))}
    </Grid>
  );
};

export default InsightChips;
