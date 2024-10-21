import React from 'react';
import { Box, Typography } from '@mui/material';

const relationships = ['Everything', 'Family', 'Friends', 'Relations', 'Work', 'Life'];

const RelationshipTags: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
      {relationships.map((relationship) => (
        <Box
          key={relationship}
          sx={{
            width: 100,
            height: 100,
            backgroundColor: '#fff',
            borderRadius: '50%',
            boxShadow: 3,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: 24, height: 24, backgroundColor: '#ccc', borderRadius: '50%' }} />
          <Typography sx={{ color: 'gray', fontWeight: 'bold', mt: 1 }}>{relationship}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default RelationshipTags;
