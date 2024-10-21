import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';

interface VolumeToggleProps {
  buttonColor: string;
}

const volumeLevels = ['A Little', 'Normal', 'Enough', 'A Lot'];

const VolumeToggle: React.FC<VolumeToggleProps> = ({ buttonColor }) => {
  const [selectedLevel, setSelectedLevel] = useState('A Little');

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', mt: -3 }}>
      {volumeLevels.map((level) => (
        <Typography
          key={level}
          variant="body1"
          onClick={() => setSelectedLevel(level)}
          sx={{
            cursor: 'pointer',
            color: selectedLevel === level ? 'black' : 'gray',
            fontWeight: selectedLevel === level ? 'bold' : 'normal',
            fontSize: selectedLevel === level ? '1.25rem' : '1rem',
          }}
        >
          {level}
        </Typography>
      ))}
      <Box
        sx={{
          position: 'absolute',
          width: 32,
          height: 32,
          backgroundColor: buttonColor,
          borderRadius: '50%',
          top: '-16px',
          transform: `translateX(${volumeLevels.indexOf(selectedLevel) * 80}px)`,
          transition: 'transform 0.3s ease-in-out',
        }}
      />
    </Box>
  );
};

export default VolumeToggle;
