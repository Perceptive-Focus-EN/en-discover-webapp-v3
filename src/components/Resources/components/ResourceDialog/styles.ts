// src/components/Resources/components/ResourceDialog/styles.ts
import { styled } from '@mui/material/styles';
import { Box, Paper } from '@mui/material';

export const DialogContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  overflow: 'auto',
  backgroundColor: theme.palette.background.default
}));

export const DialogHeaderContainer = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  backgroundColor: theme.palette.background.paper,
  zIndex: theme.zIndex.appBar,
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
  maxWidth: '768px',
  margin: '0 auto',
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2)
  }
}));

export const MetadataContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper
}));