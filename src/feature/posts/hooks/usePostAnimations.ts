
// src/features/posts/hooks/usePostAnimations.ts
import { useState, useCallback } from 'react';

export const usePostAnimations = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleRemove = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isExpanded,
    isVisible,
    handleExpand,
    handleRemove
  };
};