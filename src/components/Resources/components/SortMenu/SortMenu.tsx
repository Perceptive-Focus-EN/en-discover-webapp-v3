// src/components/Resources/components/SortMenu/SortMenu.tsx
import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography
} from '@mui/material';
import {
  SortByAlpha,
  Schedule,
  Star,
  DateRange,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { ResourceSortOptions, ResourceSortField } from '../../../../types/ArticleMedia';
import { SortStyles } from './styles';

interface SortMenuProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  currentSort: ResourceSortOptions;
  onSortChange: (sort: ResourceSortOptions) => void;
}

export const SortMenu: React.FC<SortMenuProps> = ({
  open,
  anchorEl,
  onClose,
  currentSort,
  onSortChange
}) => {
  const SORT_OPTIONS: Array<{
    field: ResourceSortField;
    label: string;
    icon: React.ReactElement;
  }> = [
    { field: 'datePublished', label: 'Date Published', icon: <DateRange /> },
    { field: 'title', label: 'Title', icon: <SortByAlpha /> },
    { field: 'rating', label: 'Rating', icon: <Star /> },
    { field: 'readTime', label: 'Read Time', icon: <Schedule /> }
  ];

  const handleSortSelect = (field: ResourceSortField) => {
    const newOrder = currentSort.field === field && currentSort.order === 'asc' 
      ? 'desc' 
      : 'asc';
    
    onSortChange({
      field,
      order: newOrder
    });
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right'
      }}
      PaperProps={{
        sx: SortStyles.menu
      }}
    >
      <Typography variant="subtitle2" sx={SortStyles.header}>
        Sort By
      </Typography>
      <Divider />
      {SORT_OPTIONS.map(({ field, label, icon }) => (
        <MenuItem
          key={field}
          onClick={() => {
            handleSortSelect(field);
            onClose();
          }}
          selected={currentSort.field === field}
          sx={SortStyles.menuItem}
        >
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText primary={label} />
          {currentSort.field === field && (
            currentSort.order === 'asc' ? <ArrowUpward /> : <ArrowDownward />
          )}
        </MenuItem>
      ))}
    </Menu>
  );
};