// src/components/Resources/components/FilterDrawer/FilterDrawer.tsx
import React, { useState, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Button,
  Divider,
  FormControl,
  FormGroup,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Chip,
  IconButton,
  useTheme
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ResourceFilters, ResourceStatus, ResourceVisibility } from '../../types/Resources';
import { FilterStyles } from './styles';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: ResourceFilters;
  onFilterChange: (filters: ResourceFilters) => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onClose,
  filters,
  onFilterChange
}) => {
  const theme = useTheme();
  const [localFilters, setLocalFilters] = useState<ResourceFilters>(filters);

  const handleReset = useCallback(() => {
    const emptyFilters: ResourceFilters = {
      category: [],
      status: undefined,
      visibility: undefined,
      dateRange: undefined,
      readingLevel: undefined,
      tags: [],
      searchTerm: ''
    };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  }, [onFilterChange]);

  const handleApply = useCallback(() => {
    onFilterChange(localFilters);
    onClose();
  }, [localFilters, onFilterChange, onClose]);

  const handleCategoryToggle = useCallback((category: string) => {
    setLocalFilters(prev => ({
      ...prev,
      category: prev.category?.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...(prev.category || []), category]
    }));
  }, []);

  const CATEGORIES = [
    'Tutorials',
    'Articles',
    'Case Studies',
    'Research',
    'Guides',
    'Best Practices'
  ];

  const READING_LEVELS = ['beginner', 'intermediate', 'advanced'];
  const STATUSES: ResourceStatus[] = ['draft', 'published', 'archived', 'under_review'];
  const VISIBILITIES: ResourceVisibility[] = ['public', 'private', 'organization'];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: FilterStyles.drawer
      }}
    >
      <Box sx={FilterStyles.container}>
        {/* Header */}
        <Box sx={FilterStyles.header}>
          <Typography variant="h6">Filters</Typography>
          <Box>
            <Button 
              onClick={handleReset}
              color="inherit"
              size="small"
            >
              Reset
            </Button>
            <IconButton 
              onClick={onClose}
              size="small"
              sx={FilterStyles.closeButton}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        {/* Filter Sections */}
        <Box sx={FilterStyles.content}>
          {/* Categories */}
          <Box sx={FilterStyles.section}>
            <Typography variant="subtitle2" gutterBottom>
              Categories
            </Typography>
            <FormGroup>
              {CATEGORIES.map((category) => (
                <FormControlLabel
                  key={category}
                  control={
                    <Checkbox
                      checked={localFilters.category?.includes(category) || false}
                      onChange={() => handleCategoryToggle(category)}
                      size="small"
                    />
                  }
                  label={category}
                />
              ))}
            </FormGroup>
          </Box>

          <Divider />

          {/* Status */}
          <Box sx={FilterStyles.section}>
            <Typography variant="subtitle2" gutterBottom>
              Status
            </Typography>
            <RadioGroup
              value={localFilters.status || ''}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                status: e.target.value as ResourceStatus
              }))}
            >
              {STATUSES.map((status) => (
                <FormControlLabel
                  key={status}
                  value={status}
                  control={<Radio size="small" />}
                  label={status.charAt(0).toUpperCase() + status.slice(1)}
                />
              ))}
            </RadioGroup>
          </Box>

          <Divider />

          {/* Visibility */}
          <Box sx={FilterStyles.section}>
            <Typography variant="subtitle2" gutterBottom>
              Visibility
            </Typography>
            <RadioGroup
              value={localFilters.visibility || ''}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                visibility: e.target.value as ResourceVisibility
              }))}
            >
              {VISIBILITIES.map((visibility) => (
                <FormControlLabel
                  key={visibility}
                  value={visibility}
                  control={<Radio size="small" />}
                  label={visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                />
              ))}
            </RadioGroup>
          </Box>

          <Divider />

          {/* Reading Level */}
          <Box sx={FilterStyles.section}>
            <Typography variant="subtitle2" gutterBottom>
              Reading Level
            </Typography>
            <RadioGroup
              value={localFilters.readingLevel || ''}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                readingLevel: e.target.value as "beginner" | "intermediate" | "advanced" | undefined
              }))}
            >
              {READING_LEVELS.map((level) => (
                <FormControlLabel
                  key={level}
                  value={level}
                  control={<Radio size="small" />}
                  label={level.charAt(0).toUpperCase() + level.slice(1)}
                />
              ))}
            </RadioGroup>
          </Box>

          <Divider />

          {/* Tags */}
          <Box sx={FilterStyles.section}>
            <Typography variant="subtitle2" gutterBottom>
              Tags
            </Typography>
            <TextField
              size="small"
              placeholder="Add tag and press enter"
              fullWidth
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value && !localFilters.tags?.includes(value)) {
                    setLocalFilters(prev => ({
                      ...prev,
                      tags: [...(prev.tags || []), value]
                    }));
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <Box sx={FilterStyles.tags}>
              {localFilters.tags?.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => setLocalFilters(prev => ({
                    ...prev,
                    tags: prev.tags?.filter(t => t !== tag)
                  }))}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={FilterStyles.footer}>
          <Button
            variant="outlined"
            onClick={onClose}
            fullWidth
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApply}
            fullWidth
            sx={{ ml: 1 }}
          >
            Apply Filters
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};