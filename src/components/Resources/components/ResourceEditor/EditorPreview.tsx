// src/components/Resources/components/ResourceEditor/EditorPreview.tsx
import React from 'react';
import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { PreviewContainer } from './styles';

interface EditorPreviewProps {
  content: string;
}

export const EditorPreview: React.FC<EditorPreviewProps> = ({ content }) => {
  return (
    <Box className="preview-pane">
      <PreviewContainer>
        <ReactMarkdown>{content}</ReactMarkdown>
      </PreviewContainer>
    </Box>
  );
};