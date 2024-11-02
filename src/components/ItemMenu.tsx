import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Grid, Typography, useTheme, useMediaQuery, ButtonBase } from '@mui/material';
import { useDrag, useDrop } from 'react-dnd';
import Link from 'next/link';

// Existing interfaces remain the same
interface DragItem {
  id: number;
  index: number;
}

export interface NavItem {
  id: number;
  name: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
}

// Updated NavigationState
interface NavigationState {
  mainNavOrder: number[];
  displayOrder: Record<number, number>;
  isCustomized: boolean;
  fixedItems: number[]; // Add this to track Home and More
}

export interface ItemMenuProps {
  items: NavItem[];
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onItemClick: (item: NavItem) => void;
  mainNavCount?: number;
  isMainNavigation?: boolean;
  onNavigationChange?: (mainNavOrder: number[]) => void; // Add this
}



interface DraggableNavItemProps {
  item: NavItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onItemClick: (item: NavItem) => void;
  isMainNavigation: boolean;
  onSwap?: (draggedId: number, targetId: number) => void;
  mainNavCount: number; // Add this
}

const FIXED_IDS = [1, 5];

// Add transition validation
const isValidTransition = (
  dragIndex: number, 
  hoverIndex: number, 
  currentState: NavigationState,
  mainNavCount: number
): boolean => {
  // Check bounds
  if (dragIndex < 0 || hoverIndex < 0) return false;
  if (dragIndex >= mainNavCount || hoverIndex >= mainNavCount) return false;

  // Check fixed items
  const dragId = currentState.mainNavOrder[dragIndex];
  const hoverId = currentState.mainNavOrder[hoverIndex];
  if (FIXED_IDS.includes(dragId) || FIXED_IDS.includes(hoverId)) return false;

  // Check for rapid changes
  const now = Date.now();
  if (now - lastTransitionTime < 100) return false; // Debounce
  lastTransitionTime = now;

  return true;
};

// Add state validation
const validateNavigation = (order: number[], mainNavCount: number): boolean => {
  if (!order || !Array.isArray(order)) return false;
  if (order.length !== mainNavCount) return false;
  if (order[0] !== FIXED_IDS[0]) return false; // Check Home
  if (order[order.length - 1] !== FIXED_IDS[1]) return false; // Check More
  return true;
};

const TRANSITION_DELAY = 100; // ms
const TRANSITION_COOLDOWN = 200; // ms
let lastTransitionTime = 0;

// DraggableNavItem with added swap functionality
const DraggableNavItem: React.FC<DraggableNavItemProps> = React.memo(({ 
  item, 
  index, 
  moveItem, 
  onItemClick, 
  isMainNavigation,
  onSwap,
  mainNavCount // Add this
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'navItem',
    item: { id: item.id, index, isMainNavigation },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => {
      // Now mainNavCount is available here
      return !FIXED_IDS.includes(item.id) && 
             index > 0 && 
             index < mainNavCount - 1;
    },
  }));

  const [{ isOver }, drop] = useDrop({
    accept: 'navItem',
    hover(draggedItem: DragItem & { isMainNavigation: boolean }) {
      if (
        !drag || 
        draggedItem.id === item.id ||
        FIXED_IDS.includes(item.id) ||
        FIXED_IDS.includes(draggedItem.id) ||
        index === 0 ||
        index === mainNavCount - 1
      ) return;

      moveItem(draggedItem.index, index);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      drag(drop(node));
    }
  }, [drag, drop]);

  // Rest of DraggableNavItem remains the same
  return (
    <Grid 
      item 
      xs={2.4} 
      ref={ref}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.3s ease',
        transform: isOver ? 'scale(1.05)' : 'none',
      }}
    >
      <ButtonBase
        component={item.path ? Link : 'button'}
        href={item.path}
        onClick={() => {
          if (item.onClick) item.onClick();
          onItemClick(item);
        }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: isMobile ? 1 : 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: isMainNavigation ? 2 : 1,
          cursor: FIXED_IDS.includes(item.id) ? 'default' : 'move',
          border: isMainNavigation ? `2px solid ${theme.palette.primary.main}` : 'none',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: 3,
          },
        }}
      >
        {React.cloneElement(item.icon as React.ReactElement, { 
          fontSize: isMobile ? 'small' : 'medium',
          sx: { mb: isMobile ? 0.5 : 1, color: isMainNavigation ? 'primary.main' : 'inherit' },
        })}
        <Typography variant="caption" sx={{ fontSize: isMobile ? '0.6rem' : '0.75rem' }}>
          {item.name}
        </Typography>
      </ButtonBase>
    </Grid>
  );
});

export const ItemMenu: React.FC<ItemMenuProps> = ({ 
  items, 
  moveItem, 
  onItemClick, 
  mainNavCount = 5, 
  isMainNavigation = true,
  onNavigationChange 
}) => {

  const initialNavigationState = useMemo(() => {
  const middleItems = items
    .slice(1, mainNavCount - 1)
    .map(item => item.id);

  const defaultOrder = [
    FIXED_IDS[0],
    ...middleItems,
    FIXED_IDS[1]
  ];

  return {
    mainNavOrder: defaultOrder,
    displayOrder: defaultOrder.reduce((acc, id, idx) => ({
      ...acc,
      [idx]: id
    }), {}),
    isCustomized: false,
    fixedItems: FIXED_IDS
  };
  }, [items, mainNavCount]);

  const [navigationState, setNavigationState] = useState<NavigationState>(initialNavigationState)

  useEffect(() => {
    const savedOrder = localStorage.getItem('navigationState');
    if (savedOrder) {
      try {
        // Validate state transition from storage
        const parsed = JSON.parse(savedOrder);
        if (validateNavigation(parsed.mainNavOrder, mainNavCount)) {
          setNavigationState(parsed);
        }
      } catch (error) {
        console.error('Invalid state transition:', error);
      }
    }
  }, [mainNavCount]);

  useEffect(() => {
    localStorage.setItem('navigationState', JSON.stringify(navigationState));
  }, [navigationState]);

  const handleMove = useCallback((dragIndex: number, hoverIndex: number) => {
  // Don't process moves if dealing with fixed items
  if (dragIndex <= 0 || 
      hoverIndex <= 0 || 
      dragIndex >= mainNavCount - 1 || 
      hoverIndex >= mainNavCount - 1) {
    return;
  }

  setNavigationState(prev => {
    const newDisplayOrder = { ...prev.displayOrder };
    
    // Only allow moving middle items
    const middleItems = Object.entries(newDisplayOrder)
      .filter(([_, id]) => !FIXED_IDS.includes(id))
      .map(([_, id]) => id);

    // Update display order
    const updatedOrder = [
      FIXED_IDS[0], // Home
      ...middleItems,
      FIXED_IDS[1]  // More
    ];

    // Call parent handler with new order
    if (onNavigationChange) {
      onNavigationChange(updatedOrder);
    }

    return {
      ...prev,
      mainNavOrder: updatedOrder,
      displayOrder: updatedOrder.reduce((acc, id, idx) => ({
        ...acc,
        [idx]: id
      }), {}),
      isCustomized: true
    };
  });
  }, [mainNavCount, onNavigationChange]);
  
  const handleSwap = useCallback((draggedId: number, targetId: number) => {
      const now = Date.now();
      if (now - lastTransitionTime < TRANSITION_DELAY) return;
      if (now - lastTransitionTime < TRANSITION_COOLDOWN) return;
      lastTransitionTime = now;

    setNavigationState(prev => {
      const newMainOrder = [...prev.mainNavOrder];
      const draggedIndex = newMainOrder.indexOf(draggedId);
      const targetIndex = newMainOrder.indexOf(targetId);

      // Current state probability transitions
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Internal swap - highest probability state
        [newMainOrder[draggedIndex], newMainOrder[targetIndex]] = 
        [newMainOrder[targetIndex], newMainOrder[draggedIndex]];
      } else if (draggedIndex !== -1) {
        // Exit state - medium probability
        newMainOrder.splice(draggedIndex, 1);
        newMainOrder.push(targetId);
      } else if (targetIndex !== -1) {
        // Entry state - medium probability
        newMainOrder.splice(targetIndex, 1);
        newMainOrder.push(draggedId);
      }

      // Notify parent of navigation change
      if (onNavigationChange) {
        onNavigationChange(newMainOrder);
      }

      return {
        ...prev,
        mainNavOrder: newMainOrder,
        isCustomized: true
      };
    });
  }, [onNavigationChange]);
  // const resetToDefault = useCallback(() => {
  const resetToDefault = useCallback(() => {
    setNavigationState(initialNavigationState);
    localStorage.removeItem('navigationState');
  }, [initialNavigationState]);

  return (
  <Grid container spacing={1} justifyContent="center">
    {items.map((item, index) => {
      const shouldShow = !isMainNavigation || 
        (isMainNavigation && navigationState.mainNavOrder.includes(item.id));

      if (!shouldShow) return null;

      return (
        <DraggableNavItem
          key={item.id}
          item={item}
          index={index}
          moveItem={moveItem}
          onItemClick={onItemClick}
          isMainNavigation={navigationState.mainNavOrder.includes(item.id)}
          onSwap={handleSwap}
          mainNavCount={mainNavCount} // Add this
        />
      );
    })}
  </Grid>
  );
}

export default ItemMenu;