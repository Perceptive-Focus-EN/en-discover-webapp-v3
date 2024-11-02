// src/components/Resources/components/ResourceEditor/EditorContent.tsx
import React, { forwardRef, useCallback, useImperativeHandle } from 'react';
import { Box } from '@mui/material';
import { EditorContentWrapper } from './styles';

export interface EditorContentProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface EditorContentRef {
  focus: () => void;
  getSelection: () => { start: number; end: number; text: string };
  setSelection: (start: number, end: number) => void;
  insertText: (text: string, moveSelection?: boolean) => void;
}

export const EditorContent = forwardRef<EditorContentRef, EditorContentProps>(({
  value,
  onChange,
  onKeyDown,
  placeholder = "Start writing your content here...",
  disabled = false,
  autoFocus = false
}, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
    getSelection: () => {
      const textarea = textareaRef.current;
      if (!textarea) return { start: 0, end: 0, text: '' };
      
      return {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
        text: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
      };
    },
    setSelection: (start: number, end: number) => {
      textareaRef.current?.setSelectionRange(start, end);
    },
    insertText: (text: string, moveSelection = true) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + text + value.substring(end);
      
      onChange(newValue);

      // Move cursor after insertion
      setTimeout(() => {
        if (moveSelection) {
          textarea.setSelectionRange(start + text.length, start + text.length);
        } else {
          textarea.setSelectionRange(start, start + text.length);
        }
      }, 0);
    }
  }));

  const handleTab = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Handle multiple lines
      if (start !== end) {
        const selectedLines = value.substring(start, end).split('\n');
        const newLines = selectedLines.map(line => 
          e.shiftKey ? line.replace(/^  /, '') : '  ' + line
        );
        const newText = newLines.join('\n');
        const newValue = value.substring(0, start) + newText + value.substring(end);
        
        onChange(newValue);

        // Maintain selection
        setTimeout(() => {
          textarea.setSelectionRange(
            start,
            start + newText.length
          );
        }, 0);
      } else {
        // Single line tab
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onChange(newValue);

        // Move cursor after tab
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
      }
    }
  }, [value, onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    
    onChange(newValue);

    // Move cursor after pasted text
    setTimeout(() => {
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  }, [value, onChange]);

  return (
    <EditorContentWrapper>
      <textarea
        ref={textareaRef}
        className="editor-pane"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          handleTab(e);
          onKeyDown?.(e);
        }}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        spellCheck="true"
        wrap="soft"
      />
    </EditorContentWrapper>
  );
});

EditorContent.displayName = 'EditorContent';

export default EditorContent;