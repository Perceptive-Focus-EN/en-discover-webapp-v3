import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, TextField, Typography, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';

interface PinInputProps {
  length: number;
  onComplete: (pin: string) => void;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
}

const PinBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
}));

const PinTextField = styled(TextField)(({ theme }) => ({
  width: '3rem',
  height: '4rem',
  '& .MuiOutlinedInput-root': {
    height: '100%',
    width: '100%',
    borderRadius: theme.shape.borderRadius * 2,
    fontSize: '1.5rem',
    textAlign: 'center',
  },
}));

const PinInput: React.FC<PinInputProps> = ({ length, onComplete, disabled = false, error = false, hint }) => {
  const [pin, setPin] = useState<string[]>(() => Array(length).fill(''));
  const [isClient, setIsClient] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setIsClient(true);
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = useCallback((index: number, value: string) => {
    if (value.length <= 1) {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      if (newPin.every(digit => digit !== '')) {
        onComplete(newPin.join(''));
      }
    }
  }, [length, onComplete, pin]);

  const handleKeyDownWrapper = useCallback((index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [pin]);

  if (!isClient) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <PinBox>
        {Array.from({ length }, (_, index) => (
          <PinTextField
            key={index}
            inputRef={el => inputRefs.current[index] = el}
            value={pin[index]}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={handleKeyDownWrapper(index)}
            disabled={disabled}
            error={error}
            inputProps={{ maxLength: 1, inputMode: 'numeric' }}
          />
        ))}
      </PinBox>
      {hint && (
        <Typography
          variant="caption"
          color={error ? 'error' : 'textSecondary'}
          sx={{ mt: 1 }}
        >
          {hint}
        </Typography>
      )}
    </Box>
  );
};

export default PinInput;