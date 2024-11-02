// Types consolidation at the top
// src/pages/resources.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Grid,
  Button,
  IconButton,
  Pagination,
  useTheme,
  useMediaQuery,
  Paper,
  Menu,
  MenuItem,
  Chip,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';

// Import components and hooks
import CreateResourceForm from './CreateResourceForm/CreateResourceForm';
import { ResourceCard } from '../components/Resources/components/ResourceCard';
import { FilterDrawer } from './FilterDrawer/FilterDrawer';
import { useResourceList } from '../components/Resources/hooks/useResourceList';
import { useResourceActions } from '../components/Resources/hooks/useResourceActions';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

// Import types
import { Resource, ResourceVisibility, ResourceStatus } from '../types/Resources/resources';
import { ResourcePermissions } from '../types/Resources/permissions';

// Styled components
const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4)
}));

const SearchBar = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2)
}));

const ResourcesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);

  // Hooks
  const {
    state: { resources, loading, error, filters, sort, pagination },
    handleSearch,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    refreshResources
  } = useResourceList();

  const {
    handleBookmark,
    handleRate,
    handleDelete,
    handleUpdateStatus,
    handleUpdateVisibility,
    isLoading
  } = useResourceActions();

  // Callbacks
  const handleCreateResource = useCallback(async (newResource: Omit<Resource, 'id' | 'rating' | 'votes' | 'status'>) => {
    try {
      // Log the resource being created
      console.log('Creating resource:', newResource);

      // Validate the image URL
      if (!newResource.imageUrl) {
        throw new Error('Image URL is required');
      }

      // Create the resource
      // const response = await createResource(newResource);
      await refreshResources();
      messageHandler.success('Resource created successfully!');
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create resource:', error);
      messageHandler.error('Failed to create resource');
    }
  }, [refreshResources]);

  const handleResourceAction = useCallback(async (
    actionType: string,
    resourceId: string,
    actionFn: () => Promise<any>
  ) => {
    try {
      await actionFn();
      await refreshResources();
      messageHandler.success(`Resource ${actionType} successful`);
    } catch (error) {
      console.error(`Failed to ${actionType} resource:`, error);
      messageHandler.error(`Failed to ${actionType} resource`);
    }
  }, [refreshResources]);

  // Render helpers
  const renderHeader = () => (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
      <Typography variant="h4" component="h1">
        Resources
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setIsCreateDialogOpen(true)}
      >
        Create Resource
      </Button>
    </Box>
  );

  const renderSearchBar = () => (
    <SearchBar elevation={1}>
      <TextField
        fullWidth
        placeholder="Search resources..."
        InputProps={{
          startAdornment: <SearchIcon color="action" />
        }}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <IconButton onClick={() => setIsFiltersOpen(true)}>
        <FilterListIcon />
      </IconButton>
      <IconButton onClick={(e) => setSortAnchorEl(e.currentTarget)}>
        <SortIcon />
      </IconButton>
    </SearchBar>
  );

  const renderActiveFilters = () => (
    filters && Object.keys(filters).length > 0 && (
      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
        {Object.entries(filters).map(([key, value]) => (
          <Chip
            key={key}
            label={`${key}: ${value}`}
            onDelete={() => handleFilterChange({ ...filters, [key]: undefined })}
            size="small"
          />
        ))}
      </Box>
    )
  );

  const renderResourceGrid = () => (
    <Grid container spacing={3}>
      {resources.map((resource) => (
        <Grid item key={resource.id} xs={12} sm={6} md={4}>
          <ResourceCard
            resource={resource}
            onReadMore={() => window.open(resource.imageUrl, '_blank')}
          />
        </Grid>
      ))}
    </Grid>
  );

  return (
    <StyledContainer maxWidth="lg">
      {renderHeader()}
      {renderSearchBar()}
      {renderActiveFilters()}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      ) : (
        <>
          {renderResourceGrid()}
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.currentPage}
              onChange={(_, page) => handlePageChange(page)}
              color="primary"
              size="large"
            />
          </Box>
        </>
      )}

      {/* Dialogs and Modals */}
      <CreateResourceForm
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateResource}
      />

      <FilterDrawer
        open={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={() => setSortAnchorEl(null)}
      >
        {/* Add sort options */}
        <MenuItem onClick={() => handleSortChange({ field: 'datePublished', order: 'desc' })}>
          Newest First
        </MenuItem>
        <MenuItem onClick={() => handleSortChange({ field: 'datePublished', order: 'asc' })}>
          Oldest First
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortChange({ field: 'rating', order: 'desc' })}>
          Highest Rated
        </MenuItem>
      </Menu>
    </StyledContainer>
  );
};

export default ResourcesPage;
