// src/components/Resources/components/ResourceEditor/EditorToolbar.tsx
import React from 'react';
import { 
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  IconButton,
  Divider
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatQuote,
  Code,
  FormatListBulleted,
  Title,
  Preview,
  Help
} from '@mui/icons-material';
import { EditorToolbarWrapper } from './styles';

export interface EditorToolbarProps {
  onFormat: (format: string) => void;
  onHeading: (level: number) => void;
  onTogglePreview: () => void;
  onHelp: () => void;
  showPreview: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onFormat,
  onHeading,
  onTogglePreview,
  onHelp,
  showPreview
}) => {
  return (
    <EditorToolbarWrapper>
      <Box display="flex" alignItems="center" gap={1}>
        <ToggleButtonGroup size="small">
          <Tooltip title="Bold (Ctrl+B)">
            <ToggleButton 
              value="bold" 
              onClick={() => onFormat('bold')}
            >
              <FormatBold />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Italic (Ctrl+I)">
            <ToggleButton 
              value="italic" 
              onClick={() => onFormat('italic')}
            >
              <FormatItalic />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem />

        <ToggleButtonGroup size="small">
          <Tooltip title="Heading 1">
            <ToggleButton 
              value="h1" 
              onClick={() => onHeading(1)}
            >
              <Title />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Heading 2">
            <ToggleButton 
              value="h2" 
              onClick={() => onHeading(2)}
            >
              <Title sx={{ fontSize: '1.25rem' }} />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem />

        <ToggleButtonGroup size="small">
          <Tooltip title="Quote">
            <ToggleButton 
              value="quote" 
              onClick={() => onFormat('quote')}
            >
              <FormatQuote />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Code">
            <ToggleButton 
              value="code" 
              onClick={() => onFormat('code')}
            >
              <Code />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="List">
            <ToggleButton 
              value="list" 
              onClick={() => onFormat('list')}
            >
              <FormatListBulleted />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>

        <Box flex={1} />

        <Tooltip title="Toggle Preview">
          <IconButton 
            onClick={onTogglePreview}
            color={showPreview ? 'primary' : 'default'}
          >
            <Preview />
          </IconButton>
        </Tooltip>

        <Tooltip title="Formatting Help">
          <IconButton onClick={onHelp}>
            <Help />
          </IconButton>
        </Tooltip>
      </Box>
    </EditorToolbarWrapper>
  );
};