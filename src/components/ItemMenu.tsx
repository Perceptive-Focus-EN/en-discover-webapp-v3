import React, { useCallback, useState } from 'react';
import { Grid, Typography, useTheme, useMediaQuery, ButtonBase } from '@mui/material';
import { useDrag, useDrop } from 'react-dnd';
import Link from 'next/link';

export interface NavItem {
  id: number;
  name: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
}

interface DragItem {
  id: number;
  index: number;
}

interface ItemMenuProps {
  items: NavItem[];
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onItemClick: (item: NavItem) => void;
  mainNavCount?: number;
}

interface DraggableNavItemProps {
  item: NavItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onItemClick: (item: NavItem) => void;
  isMainNavigation: boolean;
}

const DraggableNavItem: React.FC<DraggableNavItemProps> = React.memo(({ item, index, moveItem, onItemClick, isMainNavigation }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isRippling, setIsRippling] = useState(false);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'navItem',
    item: { id: item.id, index } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => isMainNavigation && item.id !== 1 && item.id !== 5,
  }));

  const [, drop] = useDrop({
    accept: 'navItem',
    hover(draggedItem: DragItem, monitor) {
      if (!drag || draggedItem.id === item.id) {
        return;
      }
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) {
        return;
      }

      if (!isMainNavigation || item.id === 1 || item.id === 5) {
        return;
      }

      moveItem(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
  });

  const ref = useCallback((node: HTMLDivElement | null) => {
    drag(drop(node));
  }, [drag, drop]);

  const handleRippleStart = () => {
    setIsRippling(true);
  };

  const handleRippleEnd = () => {
    setIsRippling(false);
  };

  return (
    <Grid item xs={2.4} ref={ref}>
      <ButtonBase
        component={item.path ? Link : 'button'}
        href={item.path}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          handleRippleStart();
          if (item.onClick) item.onClick();
          onItemClick(item);
        }}
        onTouchEnd={handleRippleEnd}
        onMouseUp={handleRippleEnd}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? 1 : 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 1,
          opacity: isDragging ? 0.5 : 1,
          cursor: item.id === 1 || !isMainNavigation ? 'default' : 'move',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: 3,
          },
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)',
            opacity: isRippling ? 1 : 0,
            transform: isRippling ? 'scale(2)' : 'scale(0)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }
        }}
      >
        {React.cloneElement(item.icon as React.ReactElement, { 
          fontSize: isMobile ? 'small' : 'medium',
          sx: { mb: isMobile ? 0.5 : 1 }
        })}
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: isMobile ? '0.6rem' : '0.75rem',
          }}
        >
          {item.name}
        </Typography>
      </ButtonBase>
    </Grid>
  );
});

const ItemMenu: React.FC<ItemMenuProps> = ({ items, moveItem, onItemClick, mainNavCount = 5 }) => {
  return (
    <Grid container spacing={1} justifyContent="center">
      {items.map((item, index) => (
        <DraggableNavItem
          key={item.id}
          item={item}
          index={index}
          moveItem={moveItem}
          onItemClick={onItemClick}
          isMainNavigation={index < mainNavCount}
        />
      ))}
    </Grid>
  );
};

export { DraggableNavItem, ItemMenu };