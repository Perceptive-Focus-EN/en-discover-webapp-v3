// src/components/Resources/ResourceList.tsx
import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography, CircularProgress } from '@mui/material';
import ResourceCard from './ResourceCard';
import { useResources } from '../../hooks/useResources';
import { Resource, ResourceFilters, validateResource } from '@/types/ArticleMedia';

// src/components/Resources/ResourceList.tsx
interface ResourceListProps {
    searchTerm?: string;
    loading?: boolean;
    filters?: ResourceFilters;
}

export const ResourceList: React.FC<ResourceListProps> = ({ 
    searchTerm,
    loading,
    filters 
}) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const { getResources, error } = useResources();

    useEffect(() => {
        const fetchResources = async () => {
            try {
                // Use proper pagination and search
                const response = await getResources(1, 10, {
                    ...filters,
                    searchTerm: searchTerm
                });
                
                // Validate resources before setting
                const validResources = response.filter(resource => {
                    try {
                        return validateResource(resource);
                    } catch (error) {
                        console.error('Invalid resource:', error);
                        return false;
                    }
                });
                
                setResources(validResources);
            } catch (error) {
                console.error('Failed to fetch resources:', error);
            }
        };

        fetchResources();
    }, [searchTerm, filters]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={4}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={3}>
            {resources.map((resource) => (
                <Grid item xs={12} sm={6} md={4} key={resource.id}>
                    <ResourceCard
                        resource={resource}
                        permissions={{
                            canView: true,
                            canEdit: true,
                            canDelete: true,
                            canComment: true,
                            canShare: true
                        }}
                    />
                </Grid>
            ))}
        </Grid>
    );
};