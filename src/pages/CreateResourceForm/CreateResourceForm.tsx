import React, { useState, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Autocomplete,
    Typography,
    Chip,
    Stepper,
    Step,
    StepLabel,
    Card,
    Slider,
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useArticleMedia } from '@/hooks/useArticleMedia';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import {
    Resource,
    ResourceFormData,
    ResourceInteractions,
    ResourcePermissions,
} from '@/types/ArticleMedia';
import ImageRenderer from '../ImageRenderer/ImageRenderer';
import { FileCategory } from '@/UploadingSystem/constants/uploadConstants';
import { useResources } from '@/hooks/useResources';

const STEPS = ['Basic Info', 'Content', 'Metadata', 'Review'];
const PREDEFINED_CATEGORIES = ['Technology', 'Health', 'Science', 'Education'];

interface CreateResourceFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (resource: Omit<Resource, 'id' | 'rating' | 'votes' | 'status'>) => void;
    permissions?: ResourcePermissions;
}

const CreateResourceForm: React.FC<CreateResourceFormProps> = ({ open, onClose, onSubmit }) => {
    const { createResource, loading: createLoading } = useResources();

    console.log('CreateResourceForm initialized with open:', open);

    const [activeStep, setActiveStep] = useState(0);
    console.log('Initial activeStep:', activeStep);

    const [formState, setFormState] = useState<ResourceFormData>({
        title: '',
        abstract: '',
        content: '',
        imageUrl: '',
        categories: [],
        readTime: 5,
        author: { name: '', avatar: '' },
        visibility: 'public',
        datePublished: '',
        metadata: {
            readingLevel: 'intermediate',
            language: 'en',
            tags: [],
            references: [],
            attachments: [],
            originalName: '',
            mimeType: '',
            uploadedAt: '',
            fileSize: 0,
            accessLevel: 'public',
            retention: 'permanent',
            processingSteps: [],
            category: 'general' as FileCategory // Add a default category
        }
    });
    console.log('Initial formState:', formState);

    const [errors, setErrors] = useState<Record<string, string>>({});
    console.log('Initial errors:', errors);

const { uploadMedia, isUploading, progress, processingStatus } = useArticleMedia();
    console.log('useArticleMedia hook:', { uploadMedia, isUploading, progress });

    const validateStep = (step: number): boolean => {
        console.log('Validating step:', step);
        const newErrors: Record<string, string> = {};
        switch (step) {
            case 0:
                if (!formState.title.trim()) newErrors.title = 'Title is required';
                if (!formState.abstract.trim()) newErrors.abstract = 'Abstract is required';
                if (!formState.imageUrl) newErrors.imageUrl = 'Cover image is required';
                break;
            case 1:
                if (!formState.content.trim()) newErrors.content = 'Content is required';
                break;
        }
        setErrors(newErrors);
        console.log('Validation errors:', newErrors);
        return Object.keys(newErrors).length === 0;
    };

const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleImageUpload triggered');
        if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        try {
            const response = await uploadMedia(file, 'image');
            setFormState(prev => ({
                ...prev,
                imageUrl: response.fileUrl, // URL already includes SAS token
                metadata: {
                    ...prev.metadata,
                    ...response.metadata,
                    processingStatus: response.processing?.currentStep
                }
            }));
        } catch (error) {
            console.error('Upload error:', error);
            setErrors(prev => ({
                ...prev,
                imageUrl: error instanceof Error ? error.message : 'Upload failed'
            }));
        }
    }
}, [uploadMedia]);

    React.useEffect(() => {
        console.log('useEffect triggered with open:', open);
        if (!open) {
            setFormState({
                title: '',
                abstract: '',
                content: '',
                imageUrl: '',
                categories: [],
                readTime: 5,
                author: { name: '', avatar: '' },
                visibility: 'public',
                datePublished: '',
                metadata: {
                    readingLevel: 'intermediate',
                    language: 'en',
                    tags: [],
                    references: [],
                    attachments: [],
                    originalName: '',
                    mimeType: '',
                    uploadedAt: '',
                    fileSize: 0,
                    category: 'general' as FileCategory,
                    accessLevel: 'public',
                    retention: 'permanent',
                    processingSteps: []
                }
            });
            setErrors({});
            setActiveStep(0);
            console.log('Form state reset');
        }
    }, [open]);

    const handleNext = useCallback(() => {
            console.log('handleNext triggered');
            if (validateStep(activeStep)) {
                setActiveStep(prev => prev + 1);
                console.log('Moved to next step:', activeStep + 1);
            }
        }, [activeStep, validateStep]);
    
        const handleBack = useCallback(() => {
            console.log('handleBack triggered');
            setActiveStep(prev => prev - 1);
            console.log('Moved to previous step:', activeStep - 1);
        }, [activeStep]);
    
        const handleSubmit = useCallback(async () => {
        if (validateStep(activeStep)) {
            try {
                const resource = await createResource({
                    ...formState,
                    datePublished: new Date().toISOString(),
                    interactions: {
                        isBookmarked: false,
                        viewCount: 0,
                        shareCount: 0,
                        bookmarkCount: 0,
                        comments: [],
                        lastInteraction: 'created',
                        interactionHistory: [],
                        mediaInteractions: {
                            downloads: 0,
                            processingViews: 0,
                            uploadRetries: 0
                        }
                    }
                });
                onSubmit(resource);
                onClose();
                messageHandler.success('Resource created successfully');
            } catch (error) {
                console.error('Submission error:', error);
                messageHandler.error('Failed to create resource');
            }
        }
    }, [formState, activeStep, createResource, onSubmit, onClose]);


    const renderBasicInfo = () => (
        <Box display="flex" flexDirection="column" gap={3}>
            <TextField
                label="Title"
                value={formState.title}
                onChange={e => {
                    console.log('Title changed:', e.target.value);
                    setFormState((prev: any) => ({ ...prev, title: e.target.value }));
                }}
                error={!!errors.title}
                helperText={errors.title}
                required
            />
            <TextField
                label="Abstract"
                multiline
                rows={3}
                value={formState.abstract}
                onChange={e => {
                    console.log('Abstract changed:', e.target.value);
                    setFormState((prev: any) => ({ ...prev, abstract: e.target.value }));
                }}
                error={!!errors.abstract}
                helperText={errors.abstract}
                required
            />
            <Box>
                <Typography gutterBottom>Cover Image</Typography>
                <input
                    accept="image/*"
                    id="cover-image-upload"
                    type="file"
                    hidden
                    onChange={handleImageUpload}
                    disabled={isUploading}
                />
                <label htmlFor="cover-image-upload">
                    <Card
                        variant="outlined"
                        sx={{
                            height: 200,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                            borderColor: errors.imageUrl ? 'error.main' : 'divider',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {formState.imageUrl ? (
                            <Box position="relative" width="100%" height="100%">
                                    <ImageRenderer
                                        src={formState.imageUrl}
                                        alt="Resource cover"
                                        height={200}
                                        width="100%"
                                        fallbackText="Failed to load cover image"
                                        type="image"
                                        processingStatus={processingStatus ?? undefined} // From useArticleMedia
                                        onError={(error) => {
                                            console.error('Cover image error:', error);
                                            setErrors(prev => ({
                                                ...prev,
                                                imageUrl: 'Failed to load image'
                                            }));
                                        }}
                                    />
                                <Box
                                    position="absolute"
                                    top={0}
                                    left={0}
                                    right={0}
                                    bottom={0}
                                    bgcolor="rgba(0,0,0,0.4)"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    sx={{
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        '&:hover': {
                                            opacity: 1
                                        }
                                    }}
                                >
                                    <Typography color="white">
                                        Click to change image
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                gap={1}
                            >
                                <CloudUploadIcon 
                                    sx={{ 
                                        fontSize: 48, 
                                        color: isUploading ? 'primary.main' : 'text.secondary'
                                    }} 
                                />
                                <Typography color="text.secondary">
                                    {isUploading ? 'Uploading...' : 'Click to upload cover image'}
                                </Typography>
                            </Box>
                        )}
    {isUploading && (
        <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            height={4}
            sx={{ bgcolor: 'background.paper' }}
        >
            <Box
                sx={{
                    width: `${progress}%`,
                    height: '100%',
                    bgcolor: 'primary.main',
                    transition: 'width 0.2s'
                }}
            />
        </Box>
    )}
                    </Card>
                </label>
                {errors.imageUrl && (
                    <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                        {errors.imageUrl}
                    </Typography>
                )}
            </Box>
        </Box>
    );

    const renderContent = () => (
        <Box display="flex" flexDirection="column" gap={3}>
            <TextField
                label="Content"
                multiline
                rows={8}
                value={formState.content}
                onChange={e => {
                    console.log('Content changed:', e.target.value);
                    setFormState((prev: any) => ({ ...prev, content: e.target.value }));
                }}
                error={!!errors.content}
                helperText={errors.content}
                required
            />
            <Slider
                value={formState.readTime}
                onChange={(_, value) => {
                    console.log('Read time changed:', value);
                    setFormState((prev: any) => ({ ...prev, readTime: value as number }));
                }}
                min={1}
                max={60}
                valueLabelDisplay="auto"
                marks={[
                    { value: 1, label: '1 min' },
                    { value: 15, label: '15 min' },
                    { value: 30, label: '30 min' },
                    { value: 60, label: '1 hr' }
                ]}
            />
            <Autocomplete
                multiple
                options={PREDEFINED_CATEGORIES}
                freeSolo
                value={formState.categories}
                onChange={(_, newValue) => {
                    console.log('Categories changed:', newValue);
                    setFormState((prev: any) => ({ ...prev, categories: newValue }));
                }}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip label={option} {...getTagProps({ index })} />
                    ))
                }
                renderInput={(params) => (
                    <TextField {...params} label="Categories" placeholder="Add categories" />
                )}
            />
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Create New Resource</DialogTitle>
            <DialogContent dividers>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {STEPS.map(label => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                <Box mt={3}>
                    {activeStep === 0 && renderBasicInfo()}
                    {activeStep === 1 && renderContent()}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleBack} disabled={activeStep === 0}>Back</Button>
                {activeStep === STEPS.length - 1 ? (
                    <Button onClick={handleSubmit} variant="contained" disabled={!formState.title || !formState.imageUrl}>
                        Create Resource
                    </Button>
                ) : (
                    <Button onClick={handleNext} variant="contained">Next</Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default CreateResourceForm;
