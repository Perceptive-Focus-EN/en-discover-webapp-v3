// src/components/Resources/components/ResourceEditor/ResourceEditor.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Dialog,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { EditorContainer } from './styles';
import { EditorToolbar } from './EditorToolbar';
import { EditorContent, EditorContentRef } from './EditorContent';
import { EditorPreview } from './EditorPreview';
import { FormattingHelp } from './FormattingHelp';
import { formatText } from './utils';


export interface ResourceEditorProps {
  initialValue?: string;
  onChange: (value: string) => void;
  onSave?: (content: any) => void;
  autoSave?: boolean;
  autoSaveInterval?: number;

}

export const ResourceEditor: React.FC<ResourceEditorProps> = ({
  initialValue = '',
  onChange,
  onSave,
  autoSave = true,
  autoSaveInterval = 30000
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const editorRef = useRef<EditorContentRef>(null);
  
  const [content, setContent] = useState(initialValue);
  const [showPreview, setShowPreview] = useState(!isMobile);
  const [showHelp, setShowHelp] = useState(false);
  const [showAutoSaveNotification, setShowAutoSaveNotification] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;

    const timer = setInterval(() => {
      if (content !== initialValue) {
        onSave?.(content);
        setShowAutoSaveNotification(true);
      }
    }, autoSaveInterval);

    return () => clearInterval(timer);
  }, [content, initialValue, autoSave, autoSaveInterval, onSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            handleFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            handleFormat('italic');
            break;
          case 's':
            e.preventDefault();
            onSave?.(content);
            break;
          case 'p':
            e.preventDefault();
            setShowPreview(prev => !prev);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [onSave]);

  const handleFormat = useCallback((format: string) => {
    if (!editorRef.current) return;

    const selection = editorRef.current.getSelection();
    const { text } = selection;

    switch (format) {
      case 'bold':
        editorRef.current.insertText(`**${text}**`, false);
        break;
      case 'italic':
        editorRef.current.insertText(`_${text}_`, false);
        break;
      case 'code':
        editorRef.current.insertText(`\`${text}\``, false);
        break;
      case 'quote':
        editorRef.current.insertText(`> ${text}`, true);
        break;
      case 'h1':
      case 'h2':
      case 'h3':
        const level = format.charAt(1);
        editorRef.current.insertText(`${'#'.repeat(Number(level))} ${text}`, true);
        break;
      case 'list':
        editorRef.current.insertText(`- ${text}`, true);
        break;
    }
  }, []);

  const handleChange = useCallback((newValue: string) => {
    setContent(newValue);
    onChange(newValue);
  }, [onChange]);

  return (
    <EditorContainer>
      <EditorToolbar
        onFormat={handleFormat}
        onHeading={(level) => handleFormat(`h${level}`)}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onHelp={() => setShowHelp(true)}
        showPreview={showPreview}
      />
      
      <Box display="flex" flex={1} overflow="hidden">
        <EditorContent
          ref={editorRef}
          value={content}
          onChange={handleChange}
          placeholder="Start writing your content here..."
        />
        {showPreview && !isMobile && (
          <EditorPreview content={content} />
        )}
      </Box>

      <Dialog
        open={showHelp}
        onClose={() => setShowHelp(false)}
        maxWidth="md"
        fullWidth
      >
        <FormattingHelp />
      </Dialog>

      <Snackbar
        open={showAutoSaveNotification}
        autoHideDuration={3000}
        onClose={() => setShowAutoSaveNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          Content auto-saved
        </Alert>
      </Snackbar>
    </EditorContainer>
  );
};

export default ResourceEditor;