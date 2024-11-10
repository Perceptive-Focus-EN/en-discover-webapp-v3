import React, { useState, useEffect } from 'react';
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
    Delete,
} from '@mui/icons-material';
import { usePost } from '../../hooks/usePost';
import { 
    PostType, 
    PostContent,
    TextContent, 
    Visibility,
    Post,
    Media,
} from '../../api/types';
import { useUploadMedia } from '../../hooks/useUploadMedia';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { FileCategory } from '@/UploadingSystem/constants/uploadConstants';

interface FormState {
    type: PostType;
    content: PostContent;
    visibility: Visibility;
    isProcessing: boolean;
    media?: Media;
}

interface PostEditorProps {
    initialData?: Post;
    onSuccess: () => void;
    onCancel: () => void;
    isDraft?: boolean;
    onPostCreated: (post: Post) => void;
}

const createInitialContent = (type: PostType): PostContent => {
    switch (type) {
        case PostType.TEXT:
            return {
                text: '',
                backgroundColor: '#FFFFFF',
                textColor: '#000000',
                fontSize: 'medium',
                alignment: 'left',
                fontWeight: 'normal',
            };
        case PostType.PHOTO:
            return {
                photos: [],
                caption: '',
            };
        case PostType.VIDEO:
            return {
                videoUrl: '',
                duration: '0:00',
                caption: '',
            };
        case PostType.MOOD:
            return {
                mood: '',
                color: '',
                caption: '',
            };
        case PostType.SURVEY:
            return {
                question: '',
                options: [],
                caption: '',
            };
        default:
            throw new Error(`Unsupported post type: ${type}`);
    }
};

export const PostEditor: React.FC<PostEditorProps> = ({
    initialData,
    onSuccess,
    onCancel,
    isDraft,
    onPostCreated
}) => {
    const { createPost } = usePost();
    const [isUploading, setIsUploading] = useState(false);
    const [isMediaProcessing, setIsMediaProcessing] = useState(false);

    const [formState, setFormState] = useState<FormState>({
        type: initialData?.type || PostType.TEXT,
        content: initialData?.content || createInitialContent(PostType.TEXT),
        visibility: initialData?.visibility || 'public',
        isProcessing: false,
        media: initialData?.media
    });

    const { uploadMedia, progress, status, error, resetUpload } = useUploadMedia();

    const handleTypeChange = (type: PostType) => {
        setFormState(prev => ({
            ...prev,
            type,
            content: createInitialContent(type)
        }));
    };

    const handleContentUpdate = (text: string) => {
        setFormState(prev => ({
            ...prev,
            content: {
                ...prev.content,
                text
            } as TextContent
        }));
    };

    const handleMediaUpload = async (file: File, category: FileCategory) => {
        setIsUploading(true);
        try {
            const mediaResponse = await uploadMedia(file, category);
            setFormState(prev => ({
                ...prev,
                media: {
                    urls: [mediaResponse.fileUrl],
                    fileCategory: category,
                    metadata: {
                        fileSize: file.size,
                        contentType: file.type,
                    },
                }
            }));
            setIsUploading(false);
        } catch (uploadError) {
            console.error('Upload failed:', uploadError);
            messageHandler.error(error || 'Upload failed');
            setIsUploading(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setFormState(prev => ({ ...prev, isProcessing: true }));

        try {
            const newPost = await createPost({
                type: formState.type,
                content: formState.content,
                media: formState.media,
            });

            onPostCreated(newPost);
            onSuccess();
        } catch (error) {
            console.error('Failed to create post:', error);
        } finally {
            setFormState(prev => ({ ...prev, isProcessing: false }));
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
                        disabled={isUploading || isMediaProcessing}
                    >
                        <MenuItem value={PostType.TEXT}>Text Post</MenuItem>
                        <MenuItem value={PostType.PHOTO}>Photo Post</MenuItem>
                        <MenuItem value={PostType.VIDEO}>Video Post</MenuItem>
                        <MenuItem value={PostType.MOOD}>Mood Post</MenuItem>
                        <MenuItem value={PostType.SURVEY}>Survey Post</MenuItem>
                    </Select>

                    {/* Media Upload Handlers for Photo and Video */}
                    {formState.type === PostType.PHOTO && (
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleMediaUpload(file, FileCategory.IMAGE);
                            }}
                            disabled={isUploading}
                        />
                    )}

                    {formState.type === PostType.VIDEO && (
                        <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleMediaUpload(file, FileCategory.VIDEO);
                            }}
                            disabled={isUploading}
                        />
                    )}

                    {formState.type === PostType.TEXT && (
                        <TextField
                            label="Text"
                            value={(formState.content as TextContent).text}
                            onChange={(e) => handleContentUpdate(e.target.value)}
                            fullWidth
                            multiline
                        />
                    )}

                    <Divider />
                
                    <Stack direction="row" spacing={2}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isUploading || isMediaProcessing || formState.isProcessing}
                            fullWidth
                        >
                            {isUploading || isMediaProcessing || formState.isProcessing ? (
                                <CircularProgress size={24} />
                            ) : (
                                'Publish'
                            )}
                        </Button>
                        {!isDraft && (
                            <Button
                                variant="outlined"
                                disabled={isUploading || isMediaProcessing || formState.isProcessing}
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
}

export default PostEditor;
