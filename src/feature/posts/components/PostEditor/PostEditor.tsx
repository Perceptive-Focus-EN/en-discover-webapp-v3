// File path: src/feature/posts/components/PostEditor/PostEditor.tsx

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
import { usePostMedia } from '../../hooks/usePostMedia';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { UploadResponse } from '@/types/ArticleMedia';
import { UploadStatus, UPLOAD_STATUS, FileCategory } from '@/constants/uploadConstants';

export const PostEditor: React.FC<{
    initialData?: Post;
    onSuccess: () => void;
    onCancel: () => void;
    isDraft?: boolean;
    onPostCreated: (post: Post) => void;
}> = ({
    initialData,
    onSuccess,
    onCancel,
    isDraft,
    onPostCreated
}): React.ReactElement => {
    const { createPost, isLoading } = usePost();
    const { upload, progress, error: uploadError, isUploading, status, resetUpload } = usePostMedia();

    const [formState, setFormState] = useState({
        type: 'TEXT' as PostType,
        content: createInitialContent('TEXT' as PostType),
        visibility: 'public' as Visibility,
        isProcessing: false
    });

    const handleTypeChange = useCallback((newType: PostType) => {
        setFormState(prev => ({
            ...prev,
            type: newType,
            content: createInitialContent(newType as PostType)
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

    const updateFormStateWithMedia = useCallback((
        prevState: typeof formState,
        uploads: UploadResponse[],
        mediaType: PostType
    ) => {
        if (mediaType === 'PHOTO') {
            return {
                ...prevState,
                content: {
                    ...prevState.content,
                    photos: [
                        ...(prevState.content as PhotoContent).photos,
                        ...uploads.map(u => u.fileUrl)
                    ]
                } as PhotoContent,
                isProcessing: status === UPLOAD_STATUS.PROCESSING
            };
        } else if (mediaType === 'VIDEO') {
            const upload = uploads[0];
            return {
                ...prevState,
                content: {
                    ...prevState.content,
                    videoUrl: upload.fileUrl,
                    thumbnailUrl: '',
                    processingStatus: upload.status as ProcessingStatus
                } as VideoContent,
                isProcessing: status === UPLOAD_STATUS.PROCESSING
            };
        }
        return prevState;
    }, [status]);

    const handleMediaUpdate = useCallback(async (files: FileList) => {
        try {
            const uploads = await Promise.all(
                Array.from(files).map(file => upload(file, mapPostTypeToFileCategory(formState.type)))
            );
            setFormState(prev => updateFormStateWithMedia(prev, uploads, formState.type));
        } catch (error) {
            messageHandler.error('Failed to upload media');
        }
    }, [updateFormStateWithMedia, formState.type, upload]);

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
                        type="photo"
                        files={[]}
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
                        isUploading={isUploading}
                        uploadProgress={progress}
                        error={uploadError}
                        onErrorDismiss={resetUpload}
                    />
                );
            case 'VIDEO':
                return (
                    <MediaUploader
                        type="video"
                        files={[]}
                        onUpload={handleMediaUpdate}
                        onRemove={() => {
                            setFormState(prev => ({
                                ...prev,
                                content: {
                                    ...prev.content,
                                    videoUrl: '',
                                    thumbnailUrl: '',
                                    processingStatus: 'pending' as ProcessingStatus,
                                    duration: '0'
                                } as VideoContent
                            }));
                        }}
                        maxFiles={1}
                        isUploading={isUploading}
                        uploadProgress={progress}
                        error={uploadError}
                        onErrorDismiss={resetUpload}
                    />
                );
            case 'MOOD':
                return (
                    <TextField
                        label="Mood"
                        value={(formState.content as MoodContent).mood}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleContentUpdate(e.target.value)}
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

    const handleSubmit = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const postData = {
                type: formState.type,
                content: formState.content,
                visibility: formState.visibility
            };
            await createPost(postData);
            onSuccess();
        } catch (error) {
            messageHandler.error('Failed to create post');
        }
    }, [formState, createPost, onSuccess]);

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

                    {uploadError && (
                        <Typography color="error" variant="body2">
                            {uploadError}
                        </Typography>
                    )}

                    <Divider />

                    <Stack direction="row" spacing={2}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading || isUploading || formState.isProcessing}
                            fullWidth
                        >
                            {isLoading || isUploading || formState.isProcessing ? (
                                <CircularProgress size={24} />
                            ) : (
                                'Publish'
                            )}
                        </Button>
                        {!isDraft && (
                            <Button
                                variant="outlined"
                                disabled={isLoading || isUploading || formState.isProcessing}
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

// Helper function to map PostType to FileCategory
const mapPostTypeToFileCategory = (type: PostType): FileCategory => {
    switch (type) {
        case 'PHOTO':
            return 'image';
        case 'VIDEO':
            return 'video';
        default:
            throw new Error(`Unsupported post type for file upload: ${type}`);
    }
};

// Helper function to create initial content based on type
const createInitialContent = (type: PostType): PostContent => {
    switch (type) {
        case 'TEXT':
            return { text: '', backgroundColor: '#ffffff', textColor: '#000000', fontSize: 'medium', alignment: 'left' } as TextContent;
        case 'PHOTO':
            return { photos: [], caption: '', layout: 'grid' } as PhotoContent;
        case 'VIDEO':
            return { videoUrl: '', caption: '', thumbnailUrl: '', duration: '0', autoplay: false, muted: false, processingStatus: 'pending' as ProcessingStatus } as VideoContent;
        case 'MOOD':
            return { mood: '', color: '#ffffff', intensity: 1, caption: '' } as MoodContent;
        case 'SURVEY':
            return { question: '', options: [], allowMultipleChoices: false } as SurveyContent;
        default:
            throw new Error(`Unsupported post type: ${type}`);
    }
};
