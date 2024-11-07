// src/pages/resources.tsx
import React, { useState, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Paper,
  Menu,
  MenuItem,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';

// Import components
import CreateResourceForm from './CreateResourceForm/CreateResourceForm';
import { ResourceList } from './ResourceCard/ResourceList';
import { useResources } from '../hooks/useResources';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { Resource, ResourceFilters } from '@/types/ArticleMedia';
import { FilterDrawer } from './FilterDrawer/FilterDrawer';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<ResourceFilters>({});

  // Hooks
  const { 
    getResources, 
    createResource, 
    loading, 
    error 
  } = useResources();

  // Callbacks
  const handleCreateResource = useCallback(async (
    newResource: Omit<Resource, 'id' | 'rating' | 'votes' | 'status'>
  ) => {
    try {
      await createResource(newResource);
      messageHandler.success('Resource created successfully!');
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create resource:', error);
      messageHandler.error('Failed to create resource');
    }
  }, [createResource]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

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
        value={searchTerm}
      />
      <IconButton onClick={(e) => setSortAnchorEl(e.currentTarget)}>
        <SortIcon />
      </IconButton>
    </SearchBar>
  );

  return (
    <StyledContainer maxWidth="lg">
      {renderHeader()}
      {renderSearchBar()}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

                <ResourceList 
                searchTerm={searchTerm}
                loading={loading}
                filters={filters}
            />

        <FilterDrawer
                open={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                filters={filters}
                onFilterChange={setFilters}
      />
      

      {/* Dialogs and Modals */}
      <CreateResourceForm
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateResource}
      />

      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={() => setSortAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          // Handle sort
          setSortAnchorEl(null);
        }}>
          Newest First
        </MenuItem>
        <MenuItem onClick={() => {
          // Handle sort
          setSortAnchorEl(null);
        }}>
          Oldest First
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          // Handle sort
          setSortAnchorEl(null);
        }}>
          Highest Rated
        </MenuItem>
      </Menu>
    </StyledContainer>
  );
};

export default ResourcesPage;