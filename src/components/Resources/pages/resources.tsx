// src/components/Resources/pages/ResourcesPage.tsx
import React, { useState, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Grid,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon
} from '@mui/icons-material';

// Import existing components
import { ResourceCard } from '../components/Resources/components/ResourceCard';
import { ResourceDialog } from '../components/Resources/components/ResourceDialog';
import { ResourceEditor } from '../components/Resources/components/ResourceEditor';
import { FilterDrawer } from '../components/Resources/components/FilterDrawer/FilterDrawer';
import { SortMenu } from '../components/Resources/components/SortMenu/SortMenu';

// Import hooks
import { useResourceList } from '../components/Resources/hooks/useResourceList';
import { useResourceActions } from '../components/Resources/hooks/useResourceActions';
import { useResourceForm } from '../components/Resources/hooks/useResourceForm';
import { Resource } from '../components/Resources/types';

// Import types

// Import styles

// src/components/Resources/pages/styles.ts
export const PageStyles = {
  container: {
    py: 4
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: 4
  },
  searchBar: {
    p: 2,
    mb: 3
  },
  searchContainer: {
    display: 'flex',
    gap: 2,
    flexWrap: 'wrap'
  },
  searchField: {
    flex: 1
  },
  actionButtons: {
    display: 'flex',
    gap: 1
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    py: 4
  },
  error: {
    mb: 3
  }
} as const;


export const ResourcesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State management using existing hooks
  const {
    state: { resources, loading, error, filters, sort, pagination },
    handleSearch,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    refreshResources
  } = useResourceList();

  const { handleBookmark, handleRate } = useResourceActions();
  const { formState, handleSubmit } = useResourceForm();

  // Local state
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);

  // Event handlers
  const handleResourceClick = useCallback((resource: Resource) => {
    setSelectedResource(resource);
  }, []);

  const handleCreateClick = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleSortClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
    setIsSortMenuOpen(true);
  }, []);

  return (
    <Container maxWidth="lg" sx={PageStyles.container}>
      {/* Header Section */}
      <Box sx={PageStyles.header}>
        <Typography variant="h4" component="h1">
          Resources
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          Create Resource
        </Button>
      </Box>

      {/* Search and Filters Section */}
      <Paper sx={PageStyles.searchBar}>
        <Box sx={PageStyles.searchContainer}>
          <TextField
            placeholder="Search resources..."
            InputProps={{
              startAdornment: <SearchIcon color="action" />
            }}
            onChange={(e) => handleSearch(e.target.value)}
            fullWidth={isMobile}
            sx={PageStyles.searchField}
          />
          <Box sx={PageStyles.actionButtons}>
            <IconButton onClick={() => setIsFilterDrawerOpen(true)}>
              <FilterListIcon />
            </IconButton>
            <IconButton onClick={handleSortClick}>
              <SortIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Content Section */}
      {loading ? (
        <Box sx={PageStyles.loadingContainer}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={PageStyles.error}>
          {error.message}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {resources.map((resource) => (
            <Grid item key={resource.id} xs={12} sm={6} md={4}>
              <ResourceCard
                resource={resource}
                onReadMore={() => handleResourceClick(resource)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialogs */}
      {selectedResource && (
        <ResourceDialog
          resource={selectedResource}
          open={!!selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}

      <ResourceEditor
        onChange={(value) => {
          formState.title = value;
        }
        }
        onSave={async (content) => {
          await handleSubmit();
          setIsCreateDialogOpen(false);
          await refreshResources();
        }}
      />

      <FilterDrawer
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <SortMenu
        open={isSortMenuOpen}
        anchorEl={sortAnchorEl}
        onClose={() => {
          setIsSortMenuOpen(false);
          setSortAnchorEl(null);
        }}
        currentSort={sort}
        onSortChange={handleSortChange}
      />
    </Container>
  );
};

export default ResourcesPage;