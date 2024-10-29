// File path: src/components/PostEditor.tsx

import React, { useCallback, useState } from 'react';
import { 
    TextField, 
    Button, 
    Select, 
    MenuItem, 
    Box,
    Paper,
    Typography,
    Divider,
    IconButton,
    Tooltip,
    Stack,
    CircularProgress,
    FormControlLabel,
    Switch
} from '@mui/material';
import { 
    Public, 
    Lock, 
    People, 
    Save, 
    Delete
} from '@mui/icons-material';
import { usePost } from '../../hooks/usePost';
import { MediaUploader } from './MediaUploader';
import { 
    PostType, 
    PostContent,
    TextContent, 
    PhotoContent, 
    VideoContent,
    MoodContent,
    SurveyContent,
    Visibility,
    ProcessingStatus,
    Post
} from '../../api/types';
import { uploadApi } from '../../api/uploadApi';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

// Add onPostCreated to the props interface
interface PostEditorProps {
    initialData?: {
        content: PostContent;
        type: PostType;
        visibility?: Visibility;
    };
    onSuccess?: () => void;
    onCancel?: () => void;
    isDraft?: boolean;
    onPostCreated?: (newPost: Post) => Promise<void>;
}

export const PostEditor: React.FC<PostEditorProps> = ({ 
    initialData,
    onSuccess,
    onCancel,
    isDraft = false,
    onPostCreated
}) => {
    const { createPost, isLoading, error } = usePost();
    const [formState, setFormState] = useState({
        type: initialData?.type || 'TEXT' as PostType,
        content: initialData?.content || createInitialContent(initialData?.type || 'TEXT'),
        visibility: initialData?.visibility || 'public' as Visibility,
        isProcessing: false
    });

    const handleTypeChange = useCallback((newType: PostType) => {
        setFormState(prev => ({
            ...prev,
            type: newType,
            content: createInitialContent(newType)
        }));
    }, []);

    const handleContentUpdate = useCallback((value: string) => {
        setFormState(prev => {
            const content = prev.content;
            switch (prev.type) {
                case 'TEXT':
                    return {
                        ...prev,
                        content: {
                            ...content,
                            text: value
                        } as TextContent
                    };
                case 'PHOTO':
                    return {
                        ...prev,
                        content: {
                            ...content,
                            caption: value
                        } as PhotoContent
                    };
                case 'VIDEO':
                    return {
                        ...prev,
                        content: {
                            ...content,
                            caption: value
                        } as VideoContent
                    };
                case 'MOOD':
                    return {
                        ...prev,
                        content: {
                            ...content,
                            mood: value
                        } as MoodContent
                    };
                case 'SURVEY':
                    return {
                        ...prev,
                        content: {
                            ...content,
                            question: value
                        } as SurveyContent
                    };
                default:
                    return prev;
            }
        });
    }, []);

    const handleMediaUpdate = useCallback(async (files: FileList) => {
        setFormState(prev => ({ ...prev, isProcessing: true }));
        try {
            const uploads = await uploadApi.uploadMultiple(Array.from(files), (progress) => {
                console.log(`Upload progress: ${progress.percentage}%`);
            });

            setFormState(prev => {
                if (prev.type === 'PHOTO') {
                    return {
                        ...prev,
                        content: {
                            ...prev.content,
                            photos: [
                                ...(prev.content as PhotoContent).photos,
                                ...(uploads ? uploads.filter(u => u?.url).map(u => u.url) : [])
                            ]
                        } as PhotoContent
                    };
                } else if (prev.type === 'VIDEO') {
                    const upload = uploads && uploads[0];
                    return {
                        ...prev,
                        content: {
                            ...prev.content,
                            videoUrl: upload?.url || '', // Ensure safe access
                            thumbnailUrl: upload?.thumbnail || '',
                            processingStatus: 'processing'
                        } as VideoContent
                    };
                }
                return prev;
            });
        } catch (err) {
            console.error('Media upload failed:', err);
            messageHandler.error('Failed to upload media');
        } finally {
            setFormState(prev => ({ ...prev, isProcessing: false }));
        }
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const postData = {
                type: formState.type,
                content: formState.content,
                visibility: formState.visibility
            };

            const newPost = await createPost(postData);
            if (newPost && onPostCreated) {
                await onPostCreated(newPost);
            }
            onSuccess?.();
        } catch (err) {
            console.error('Post submission failed:', err);
        }
    }, [formState, createPost, onSuccess, onPostCreated]);

    const renderContentInput = () => {
        switch (formState.type) {
            case 'TEXT':
                return (
                    <TextField
                        label="Text"
                        value={(formState.content as TextContent).text}
                        onChange={(e) => handleContentUpdate(e.target.value)}
                        fullWidth
                        multiline
                    />
                );
            case 'PHOTO':
                return (
                    <MediaUploader
                        type={formState.type.toLowerCase() as 'photo' | 'video'}
                        files={[]} // Pass an empty array or the correct type if available
                        onUpload={handleMediaUpdate}
                        onRemove={(index) => {
                            setFormState(prev => {
                                const photos = [...(prev.content as PhotoContent).photos];
                                photos.splice(index, 1);
                                return {
                                    ...prev,
                                    content: {
                                        ...prev.content,
                                        photos
                                    } as PhotoContent
                                };
                            });
                        }}
                        maxFiles={5}
                    />
                );
            case 'VIDEO':
                return (
                    <MediaUploader
                        type={formState.type.toLowerCase() as 'photo' | 'video'}
                        files={[]} // Pass an empty array or the correct type if available
                        onUpload={handleMediaUpdate}
                        onRemove={(index) => {
                            setFormState(prev => {
                                const photos = [...(prev.content as PhotoContent).photos];
                                photos.splice(index, 1);
                                return {
                                    ...prev,
                                    content: {
                                        ...prev.content,
                                        photos
                                    } as PhotoContent
                                };
                            });
                        }}
                        maxFiles={1}
                    />
                );
            case 'MOOD':
                return (
                    <TextField
                        label="Mood"
                        value={(formState.content as MoodContent).mood}
                        onChange={(e) => handleContentUpdate(e.target.value)}
                        fullWidth
                    />
                );
            case 'SURVEY':
                return (
                    <TextField
                        label="Survey Question"
                        value={(formState.content as SurveyContent).question}
                        onChange={(e) => handleContentUpdate(e.target.value)}
                        fullWidth
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            {isDraft ? 'Edit Draft' : 'Create Post'}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Tooltip title="Visibility">
                                <Select
                                    value={formState.visibility}
                                    onChange={(e) => setFormState(prev => ({
                                        ...prev,
                                        visibility: e.target.value as Visibility
                                    }))}
                                    size="small"
                                >
                                    <MenuItem value="public"><Public fontSize="small" /> Public</MenuItem>
                                    <MenuItem value="private"><Lock fontSize="small" /> Private</MenuItem>
                                    <MenuItem value="connections"><People fontSize="small" /> Connections</MenuItem>
                                </Select>
                            </Tooltip>
                            {isDraft && (
                                <Tooltip title="Delete Draft">
                                    <IconButton size="small" onClick={onCancel}>
                                        <Delete />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                    </Box>

                    <Select
                        value={formState.type}
                        onChange={(e) => handleTypeChange(e.target.value as PostType)}
                        fullWidth
                    >
                        <MenuItem value="TEXT">Text Post</MenuItem>
                        <MenuItem value="PHOTO">Photo Post</MenuItem>
                        <MenuItem value="VIDEO">Video Post</MenuItem>
                        <MenuItem value="MOOD">Mood Post</MenuItem>
                        <MenuItem value="SURVEY">Survey Post</MenuItem>
                    </Select>

                    {renderContentInput()}

                    {error && (
                        <Typography color="error" variant="body2">
                            {error}
                        </Typography>
                    )}

                    <Divider />

                    <Stack direction="row" spacing={2}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading || formState.isProcessing}
                            fullWidth
                        >
                            {isLoading || formState.isProcessing ? (
                                <CircularProgress size={24} />
                            ) : (
                                'Publish'
                            )}
                        </Button>
                        {!isDraft && (
                            <Button
                                variant="outlined"
                                disabled={isLoading || formState.isProcessing}
                                onClick={() => {/* Save as draft logic */}}
                                startIcon={<Save />}
                            >
                                Save Draft
                            </Button>
                        )}
                        <Button
                            variant="text"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </Paper>
    );
};

// Helper function to create initial content based on type
const createInitialContent = (type: PostType): PostContent => {
    switch (type) {
        case 'TEXT':
            return {
                text: '',
                backgroundColor: '#ffffff',
                textColor: '#000000',
                fontSize: 'medium',
                alignment: 'left'
            } as TextContent;
        case 'PHOTO':
            return {
                photos: [],
                caption: '',
                layout: 'grid'
            } as PhotoContent;
        case 'VIDEO':
            return {
                videoUrl: '',
                caption: '',
                thumbnailUrl: '',
                duration: '0',
                autoplay: false,
                muted: false,
                processingStatus: 'pending' as ProcessingStatus
            } as VideoContent;
        case 'MOOD':
            return {
                mood: '',
                color: '#ffffff',
                intensity: 1,
                caption: ''
            } as MoodContent;
        case 'SURVEY':
            return {
                question: '',
                options: [],
                allowMultipleChoices: false
            } as SurveyContent;
        default:
            throw new Error(`Unsupported post type: ${type}`);
    }
};
