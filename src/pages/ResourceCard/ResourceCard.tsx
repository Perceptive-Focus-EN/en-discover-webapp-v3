import React, { useState, useCallback, useMemo } from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Box,
    IconButton,
    Chip,
    Menu,
    MenuItem,
    Rating,
    Dialog,
    Tooltip,
    Skeleton,
    Collapse,
    Alert
} from '@mui/material';
import {
    BookmarkBorder as BookmarkBorderIcon,
    Bookmark as BookmarkIcon,
    MoreVert as MoreVertIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Schedule as ScheduleIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { formatDistance } from 'date-fns';

import { Resource, ResourceStatus, ResourceVisibility } from '../../types/Resources/resources';
import { ResourcePermissions } from '../../types//Resources/permissions';
import { ShareButton } from '@/feature/posts/components/Share/ShareMenu';
import ResourceContentViewer from '../../components/Resources/ResourceContentViewer';
import { parseResourceContent } from '../../utils/parseResourceContent';
import ImageRenderer from '../ImageRenderer/ImageRenderer';

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: theme.shape.borderRadius * 2,
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8]
    }
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
    borderRadius: 16,
    height: 24,
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.dark,
    '& .MuiChip-label': {
        padding: '0 8px'
    }
}));

const ReadTimeChip = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    fontSize: '0.875rem'
}));

export interface ResourceCardProps {
    resource: Resource;
    permissions?: ResourcePermissions;
    onBookmark?: (resourceId: string) => Promise<void>;
    onRate?: (resourceId: string, rating: number) => Promise<void>;
    onDelete?: (resourceId: string) => Promise<void>;
    onStatusChange?: (resourceId: string, status: ResourceStatus) => Promise<void>;
    onVisibilityChange?: (resourceId: string, visibility: ResourceVisibility) => Promise<void>;
    onEdit?: (resource: Resource) => void;
    isLoading?: (actionType: string, resourceId: string) => boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
    resource,
    permissions,
    onBookmark,
    onRate,
    onDelete,
    onStatusChange,
    onVisibilityChange,
    onEdit,
    isLoading
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isBookmarked = useMemo(() => 
        resource?.interactions?.isBookmarked || false, 
        [resource?.interactions]
    );

    const postData = useMemo(() => ({
        id: resource?.id,
        type: 'RESOURCES',
        content: {
            text: resource?.abstract,
            title: resource?.title,
            backgroundColor: 'white',
            textColor: 'black'
        }
    }), [resource]);

    const handleBookmarkClick = useCallback(async () => {
        if (!permissions?.canView || !onBookmark || !resource) return;
        try {
            await onBookmark(resource.id);
        } catch (error) {
            setError('Failed to bookmark resource');
        }
    }, [resource, onBookmark, permissions]);

    const handleRatingChange = useCallback(async (event: React.SyntheticEvent<Element, Event>, newValue: number | null) => {
        if (!permissions?.canView || !onRate || !newValue || !resource) return;
        try {
            await onRate(resource.id, newValue);
        } catch (error) {
            setError('Failed to rate resource');
        }
    }, [resource, onRate, permissions]);

    const handleDelete = useCallback(async () => {
        if (!permissions?.canDelete || !onDelete || !resource) return;
        try {
            await onDelete(resource.id);
            setShowDeleteConfirm(false);
            setMenuAnchorEl(null);
        } catch (error) {
            setError('Failed to delete resource');
        }
    }, [resource, onDelete, permissions]);

    const handleStatusChange = useCallback(async (status: ResourceStatus) => {
        if (!permissions?.canEdit || !onStatusChange || !resource) return;
        try {
            await onStatusChange(resource.id, status);
            setMenuAnchorEl(null);
        } catch (error) {
            setError('Failed to update status');
        }
    }, [resource, onStatusChange, permissions]);

    const handleVisibilityChange = useCallback(async (visibility: ResourceVisibility) => {
        if (!permissions?.canEdit || !onVisibilityChange || !resource) return;
        try {
            await onVisibilityChange(resource.id, visibility);
            setMenuAnchorEl(null);
        } catch (error) {
            setError('Failed to update visibility');
        }
    }, [resource, onVisibilityChange, permissions]);

    const renderCardHeader = () => (
        <Box position="relative">
            <ImageRenderer
                src={resource?.imageUrl || '/path/to/fallback/image.jpg'} // URL already includes SAS token
                alt="Resource cover"
            />
            <Box
                position="absolute"
                top={8}
                right={8}
                display="flex"
                gap={1}
            >
                {permissions?.canView && (
                    <IconButton
                        onClick={handleBookmarkClick}
                        disabled={isLoading?.('bookmark', resource?.id)}
                        sx={{
                            bgcolor: 'background.paper',
                            '&:hover': { bgcolor: 'background.paper' }
                        }}
                    >
                        {isBookmarked ? (
                            <BookmarkIcon color="primary" />
                        ) : (
                            <BookmarkBorderIcon />
                        )}
                    </IconButton>
                )}
                <ShareButton post={postData} />
                {(permissions?.canEdit || permissions?.canDelete) && (
                    <IconButton
                        onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                        sx={{
                            bgcolor: 'background.paper',
                            '&:hover': { bgcolor: 'background.paper' }
                        }}
                    >
                        <MoreVertIcon />
                    </IconButton>
                )}
            </Box>
        </Box>
    );

    const renderCardContent = () => (
        <CardContent sx={{ flexGrow: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" gap={0.5} flexWrap="wrap">
                    {resource?.categories.map(category => (
                        <CategoryChip
                            key={category}
                            label={category}
                            size="small"
                        />
                    ))}
                </Box>
                <ReadTimeChip>
                    <ScheduleIcon fontSize="small" />
                    {resource?.readTime} min
                </ReadTimeChip>
            </Box>

            <Typography variant="h6" gutterBottom>
                {resource?.title}
            </Typography>

            <Typography
                color="text.secondary"
                sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: 2
                }}
            >
                {resource?.abstract}
            </Typography>

            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                    <Rating
                        value={resource?.rating}
                        precision={0.5}
                        onChange={handleRatingChange}
                        disabled={!permissions?.canView || isLoading?.('rate', resource?.id)}
                    />
                    <Typography variant="body2" color="text.secondary">
                        ({resource?.votes})
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                    {formatDistance(new Date(resource?.datePublished), new Date(), { addSuffix: true })}
                </Typography>
            </Box>
        </CardContent>
    );

    const renderCardActions = () => (
        <CardActions sx={{ p: 2, pt: 0 }}>
            <Button
                fullWidth
                variant="contained"
                onClick={() => setIsDialogOpen(true)}
                disabled={!permissions?.canView}
            >
                Read More
            </Button>
        </CardActions>
    );

    return (
        <>
            <StyledCard>
                {renderCardHeader()}
                {renderCardContent()}
                {renderCardActions()}

                <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={() => setMenuAnchorEl(null)}
                >
                    {permissions?.canEdit && (
                        <>
                            <MenuItem onClick={() => onEdit?.(resource)}>
                                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                Edit
                            </MenuItem>
                            <MenuItem onClick={() => handleVisibilityChange(
                                resource?.visibility === 'public' ? 'private' : 'public'
                            )}>
                                {resource?.visibility === 'public' ? (
                                    <>
                                        <VisibilityOffIcon fontSize="small" sx={{ mr: 1 }} />
                                        Make Private
                                    </>
                                ) : (
                                    <>
                                        <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
                                        Make Public
                                    </>
                                )}
                            </MenuItem>
                        </>
                    )}
                    {permissions?.canDelete && (
                        <MenuItem
                            onClick={() => setShowDeleteConfirm(true)}
                            sx={{ color: 'error.main' }}
                        >
                            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                            Delete
                        </MenuItem>
                    )}
                </Menu>
            </StyledCard>

            <Dialog
                fullScreen
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            >
                <Box sx={{ height: '100%', overflow: 'auto' }}>
                    <Box
                        sx={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                            bgcolor: 'background.paper',
                            borderBottom: 1,
                            borderColor: 'divider',
                            px: 2,
                            py: 1
                        }}
                    >
                        <IconButton
                            edge="start"
                            onClick={() => setIsDialogOpen(false)}
                            aria-label="close"
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    </Box>
                    <ResourceContentViewer
                        content={parseResourceContent(resource)}
                        author={resource?.author}
                        metadata={{
                            readTime: resource?.readTime,
                            datePublished: resource?.datePublished,
                            categories: resource?.categories
                        }}
                    />
                </Box>
            </Dialog>

            <Dialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                maxWidth="xs"
                fullWidth
            >
                <Box p={2}>
                    <Typography variant="h6" gutterBottom>
                        Delete Resource
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                        Are you sure you want to delete this resource? This action cannot be undone.
                    </Typography>
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Button onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDelete}
                            disabled={isLoading?.('delete', resource?.id)}
                        >
                            Delete
                        </Button>
                    </Box>
                </Box>
            </Dialog>

            <Collapse in={!!error}>
                <Alert
                    severity="error"
                    onClose={() => setError(null)}
                    sx={{ mt: 1 }}
                >
                    {error}
                </Alert>
            </Collapse>
        </>
    );
};

export default ResourceCard;
