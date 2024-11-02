// src/components/Resources/components/ResourceEditor/styles.ts
import { styled } from '@mui/material/styles';
import { Box, Paper } from '@mui/material';

export const EditorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  height: '100%'
}));

export const EditorWrapper = styled(Paper)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden'
}));

export const EditorToolbarWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default
}));

export const EditorContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  overflow: 'hidden',
  '& .editor-pane': {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing(2),
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: 1.6,
    '&:focus': {
      outline: 'none'
    }
  },
  '& .preview-pane': {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing(2),
    borderLeft: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default
  }
}));

export const PreviewContainer = styled(Box)(({ theme }) => ({
  '& h1': {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(2)
  },
  '& h2': {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(2)
  },
  '& h3': {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(1.5)
  },
  '& p': {
    marginBottom: theme.spacing(2)
  },
  '& blockquote': {
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    margin: theme.spacing(2, 0),
    padding: theme.spacing(1, 2),
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.dark
  },
  '& code': {
    fontFamily: 'monospace',
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(0.5, 1),
    borderRadius: 4
  },
  '& pre': {
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    padding: theme.spacing(2),
    borderRadius: 4,
    overflow: 'auto',
    marginBottom: theme.spacing(2)
  }
}));