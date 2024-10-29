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
    onPostCreated?: (newPost: Post) => Promise<void>; // New prop
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
        content: initialData?.content || createInitialContent('TEXT'),
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
                                ...uploads.map(u => u.url)
                            ]
                        } as PhotoContent
                    };
                } else if (prev.type === 'VIDEO') {
                    const upload = uploads[0];
                    return {
                        ...prev,
                        content: {
                            ...prev.content,
                            videoUrl: upload.url,
                            thumbnailUrl: upload.thumbnail,
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

        // Handle post submission
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const postData = {
                type: formState.type,
                content: formState.content,
                visibility: formState.visibility
            };

            const newPost = await createPost(postData); // Create the new post
            if (newPost && onPostCreated) {
                await onPostCreated(newPost); // Call the onPostCreated callback
            }
            onSuccess?.(); // Call the onSuccess callback
        } catch (err) {
            console.error('Post submission failed:', err);
        }
    }, [formState, createPost, onSuccess, onPostCreated]);


    const renderContentInput = () => {
        switch (formState.type) {
            case 'TEXT':
                return (
                    <Stack spacing={2}>
                        <TextField
                            multiline
                            rows={4}
                            value={(formState.content as TextContent).text}
                            onChange={(e) => handleContentUpdate(e.target.value)}
                            placeholder="Write your text post..."
                            fullWidth
                            variant="outlined"
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                type="color"
                                label="Background Color"
                                value={(formState.content as TextContent).backgroundColor}
                                onChange={(e) => setFormState(prev => ({
                                    ...prev,
                                    content: {
                                        ...(prev.content as TextContent),
                                        backgroundColor: e.target.value
                                    }
                                }))}
                                size="small"
                            />
                            <TextField
                                type="color"
                                label="Text Color"
                                value={(formState.content as TextContent).textColor}
                                onChange={(e) => setFormState(prev => ({
                                    ...prev,
                                    content: {
                                        ...(prev.content as TextContent),
                                        textColor: e.target.value
                                    }
                                }))}
                                size="small"
                            />
                        </Box>
                    </Stack>
                );

            case 'PHOTO':
                return (
                    <Stack spacing={2}>
                        <TextField
                            value={(formState.content as PhotoContent).caption || ''}
                            onChange={(e) => handleContentUpdate(e.target.value)}
                            placeholder="Add a caption to your photos..."
                            fullWidth
                        />
                        <MediaUploader
                            type="photo"
                            files={(formState.content as PhotoContent).photos.map(url => new File([], url))}
                            onAdd={handleMediaUpdate}
                            onRemove={(index) => {
                                setFormState(prev => ({
                                    ...prev,
                                    content: {
                                        ...(prev.content as PhotoContent),
                                        photos: (prev.content as PhotoContent).photos.filter((_, i) => i !== index)
                                    }
                                }));
                            }}
                            maxFiles={10}
                        />
                        <Select
                            value={(formState.content as PhotoContent).layout || 'grid'}
                            onChange={(e) => setFormState(prev => ({
                                ...prev,
                                content: {
                                    ...(prev.content as PhotoContent),
                                    layout: e.target.value as 'grid' | 'carousel' | 'masonry'
                                }
                            }))}
                            size="small"
                        >
                            <MenuItem value="grid">Grid Layout</MenuItem>
                            <MenuItem value="carousel">Carousel Layout</MenuItem>
                            <MenuItem value="masonry">Masonry Layout</MenuItem>
                        </Select>
                    </Stack>
                );

            case 'VIDEO':
                return (
                    <Stack spacing={2}>
                        <TextField
                            value={(formState.content as VideoContent).caption || ''}
                            onChange={(e) => handleContentUpdate(e.target.value)}
                            placeholder="Add a caption to your video..."
                            fullWidth
                        />
                        <MediaUploader
                            type="video"
                            files={(formState.content as VideoContent).videoUrl ? [new File([], (formState.content as VideoContent).videoUrl)] : []}
                            onAdd={handleMediaUpdate}
                            onRemove={() => {
                                setFormState(prev => ({
                                    ...prev,
                                    content: {
                                        ...(prev.content as VideoContent),
                                        videoUrl: '',
                                        thumbnailUrl: ''
                                    }
                                }));
                            }}
                            maxFiles={1}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={(formState.content as VideoContent).autoplay}
                                        onChange={(e) => setFormState(prev => ({
                                            ...prev,
                                            content: {
                                                ...(prev.content as VideoContent),
                                                autoplay: e.target.checked
                                            }
                                        }))}
                                    />
                                }
                                label="Autoplay"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={(formState.content as VideoContent).muted}
                                        onChange={(e) => setFormState(prev => ({
                                            ...prev,
                                            content: {
                                                ...(prev.content as VideoContent),
                                                muted: e.target.checked
                                            }
                                        }))}
                                    />
                                }
                                label="Muted"
                            />
                        </Box>
                    </Stack>
                );

            case 'MOOD':
                return (
                    <Stack spacing={2}>
                        <TextField
                            value={(formState.content as MoodContent).mood}
                            onChange={(e) => handleContentUpdate(e.target.value)}
                            placeholder="How are you feeling?"
                            fullWidth
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                type="color"
                                label="Mood Color"
                                value={(formState.content as MoodContent).color}
                                onChange={(e) => setFormState(prev => ({
                                    ...prev,
                                    content: {
                                        ...(prev.content as MoodContent),
                                        color: e.target.value
                                    }
                                }))}
                                size="small"
                            />
                            <TextField
                                type="number"
                                label="Intensity"
                                value={(formState.content as MoodContent).intensity || 1}
                                onChange={(e) => setFormState(prev => ({
                                    ...prev,
                                    content: {
                                        ...(prev.content as MoodContent),
                                        intensity: Math.max(1, Math.min(10, parseInt(e.target.value)))
                                    }
                                }))}
                                inputProps={{ min: 1, max: 10 }}
                                size="small"
                            />
                        </Box>
                        <TextField
                            value={(formState.content as MoodContent).caption || ''}
                            onChange={(e) => handleContentUpdate(e.target.value)}
                            placeholder="Add more context to your mood..."
                            fullWidth
                            multiline
                            rows={2}
                        />
                    </Stack>
                );

            case 'SURVEY':
                return (
                    <Stack spacing={2}>
                        <TextField
                            value={(formState.content as SurveyContent).question}
                            onChange={(e) => handleContentUpdate(e.target.value)}
                            placeholder="What would you like to ask?"
                            fullWidth
                        />
                        {(formState.content as SurveyContent).options.map((option, index) => (
                            <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    value={option.text}
                                    onChange={(e) => {
                                        const newOptions = [...(formState.content as SurveyContent).options];
                                        newOptions[index] = { ...option, text: e.target.value };
                                        setFormState(prev => ({
                                            ...prev,
                                            content: {
                                                ...(prev.content as SurveyContent),
                                                options: newOptions
                                            }
                                        }));
                                    }}
                                    placeholder={`Option ${index + 1}`}
                                    fullWidth
                                />
                                <IconButton
                                    onClick={() => {
                                        setFormState(prev => ({
                                            ...prev,
                                            content: {
                                                ...(prev.content as SurveyContent),
                                                options: (prev.content as SurveyContent).options.filter((_, i) => i !== index)
                                            }
                                        }));
                                    }}
                                >
                                    <Delete />
                                </IconButton>
                            </Box>
                        ))}
                        <Button
                            onClick={() => {
                                setFormState(prev => ({
                                    ...prev,
                                    content: {
                                        ...(prev.content as SurveyContent),
                                        options: [
                                            ...(prev.content as SurveyContent).options,
                                            { text: '', color: '#000000' }
                                        ]
                                    }
                                }));
                            }}
                            variant="outlined"
                            size="small"
                        >
                            Add Option
                        </Button>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={(formState.content as SurveyContent).allowMultipleChoices}
                                    onChange={(e) => setFormState(prev => ({
                                        ...prev,
                                        content: {
                                            ...(prev.content as SurveyContent),
                                            allowMultipleChoices: e.target.checked
                                        }
                                    }))}
                                />
                            }
                            label="Allow Multiple Choices"
                        />
                    </Stack>
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
