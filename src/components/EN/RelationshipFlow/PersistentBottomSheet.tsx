import React from 'react';
import { Box, Typography, Grid, Divider } from '@mui/material';
import VolumeToggle from './VolumeToggle';
import RelationshipTags from './RelationshipTags';
import CheckBoxComponent from './CheckBoxComponent';

interface PersistentBottomSheetProps {
  buttonColor: string;
  children: React.ReactNode;

}

const PersistentBottomSheet: React.FC<PersistentBottomSheetProps> = ({ buttonColor }) => {
  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        boxShadow: 3,
        width: '100%',
        height: '50vh',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: 3,
        zIndex: 10,
      }}
    >
      <VolumeToggle buttonColor={buttonColor} />
      <Divider sx={{ my: 2 }} />
      <RelationshipTags />
      <Divider sx={{ my: 2 }} />
      <CheckBoxComponent />
    </Box>
  );
};

export default PersistentBottomSheet;
