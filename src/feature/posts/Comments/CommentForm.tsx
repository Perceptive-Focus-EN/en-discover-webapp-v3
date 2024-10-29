// src/features/posts/components/Comments/CommentForm.tsx
import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  CircularProgress, 
  Typography,
  Box,
  Alert
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  initialValue?: string;
  placeholder?: string;
  isLoading?: boolean;
  error?: string | null;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  initialValue = '',
  placeholder = 'Write a comment...',
  isLoading = false,
  error = null
}) => {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isLoading || isSubmitting;

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <TextField
        multiline
        rows={2}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        fullWidth
        disabled={disabled}
        error={!!error}
        helperText={error}
        InputProps={{
          sx: { bgcolor: disabled ? 'action.disabledBackground' : 'background.paper' }
        }}
      />
      
      <Box className="flex justify-end space-x-2">
        {onCancel && (
          <Button 
            onClick={onCancel} 
            disabled={disabled}
            variant="outlined"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={disabled || !content.trim()}
          sx={{ minWidth: 100 }}
        >
          {disabled ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            'Submit'
          )}
        </Button>
      </Box>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert 
              severity="error" 
              icon={<Warning />}
              sx={{ mt: 1 }}
            >
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
};