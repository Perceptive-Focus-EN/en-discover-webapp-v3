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
import { usePostMedia } from '@/feature/posts/hooks/usePostMedia';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import {
    Resource,
    ResourceFormData,
    ResourcePermissions,
    ResourceMetadata,
    ImageMetadata,
    ResourceStatus,
    ResourceVisibility
} from '@/types/Resources';
import ImageRenderer from '../ImageRenderer/ImageRenderer';

const STEPS = ['Basic Info', 'Content', 'Metadata', 'Review'];
const PREDEFINED_CATEGORIES = ['Technology', 'Health', 'Science', 'Education'];

interface CreateResourceFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (resource: Omit<Resource, 'id' | 'rating' | 'votes' | 'status'>) => void;
    permissions?: ResourcePermissions;
}

const CreateResourceForm: React.FC<CreateResourceFormProps> = ({ open, onClose, onSubmit }) => {
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
        metadata: {
            readingLevel: 'intermediate',
            language: 'en',
            tags: [],
            references: [],
            attachments: []
        }
    });
    console.log('Initial formState:', formState);

    const [errors, setErrors] = useState<Record<string, string>>({});
    console.log('Initial errors:', errors);

    const { uploadSingle, isUploading, progress } = usePostMedia();
    console.log('usePostMedia hook:', { uploadSingle, isUploading, progress });

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
            console.log('Selected file:', file);
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({
                    ...prev,
                    imageUrl: 'Unsupported file format'
                }));
                return;
            }
            try {
                console.log('Starting upload for:', file.name);
                const response = await uploadSingle(file);
                console.log('Upload response:', response);

                if (response?.data?.url) {
                    console.log('Setting image URL:', response.data.url);

                    // Test the URL before setting it
                    const img = new Image();
                    img.onload = () => {
                        console.log('Test load successful');
                        setFormState(prev => ({
                            ...prev,
                            imageUrl: response.data.url,
                            metadata: {
                                ...prev.metadata,
                                imageMetadata: {
                                    originalName: response.data.metadata.originalName,
                                    mimeType: response.data.metadata.mimeType,
                                    uploadedAt: response.data.metadata.uploadedAt
                                }
                            }
                        }));
                    };

                    img.onerror = (error) => {
                        console.error('Test load failed:', error);
                        setErrors(prev => ({
                            ...prev,
                            imageUrl: 'Unable to load image URL'
                        }));
                    };

                    img.src = response.data.url;
                }
            } catch (err) {
                console.error('Upload error:', err);
                setErrors(prev => ({
                    ...prev,
                    imageUrl: 'Failed to upload image'
                }));
            }
        }
    }, [uploadSingle]);

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
                metadata: {
                    readingLevel: 'intermediate',
                    language: 'en',
                    tags: [],
                    references: [],
                    attachments: []
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
    }, [activeStep]);

    const handleBack = useCallback(() => {
        console.log('handleBack triggered');
        setActiveStep(prev => prev - 1);
        console.log('Moved to previous step:', activeStep - 1);
    }, [activeStep]);

    const handleSubmit = useCallback(() => {
        console.log('handleSubmit triggered');
        if (validateStep(activeStep)) {
            try {
                onSubmit({ ...formState, datePublished: new Date().toISOString() });
                console.log('Form submitted:', formState);
                onClose();
            } catch (error) {
                console.error('Submission error:', error);
                messageHandler.error('Failed to create resource');
            }
        }
    }, [formState, activeStep, onSubmit, onClose]);

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
