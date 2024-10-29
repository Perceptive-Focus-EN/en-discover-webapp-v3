// src/components/Feed/PostCreator.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  TextFields as TextIcon,
  Image as ImageIcon,
  Videocam as VideoIcon,
  Mood as MoodIcon,
  Poll as SurveyIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import useFeedOperations from './context/useFeedOperations'; // Updated import
import { PostType, PostData, PostContent } from './types/Post';
import { UserAccountTypeEnum } from '@/constants/AccessKey/accounts';
import { PhotoUploader } from './PhotoUploader';
import { ImageListType } from 'react-images-uploading';
import { VideoCard } from './cards/VideoCard';
import { useFeed } from './context/FeedContext';

interface PostCreatorProps {
  onPostCreated?: (newPost: PostData) => Promise<void>;
}

const PostCreator: React.FC<PostCreatorProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { createNewPost, uploadPostVideo, getVideoUrl } = useFeedOperations(); // Updated to use useFeedOperations
  const [expanded, setExpanded] = useState<PostType | false>(false);
  const [postType, setPostType] = useState<PostType>('TEXT');
  const [content, setContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [mood, setMood] = useState('');
  const [moodColor, setMoodColor] = useState('#000000');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
  const [padding, setPadding] = useState<'small' | 'medium' | 'large'>('medium');
  const [surveyBackgroundColor, setSurveyBackgroundColor] = useState('#f0f2f5');
  const [surveyQuestionColor, setSurveyQuestionColor] = useState('#1a1a1a');
  const [surveyOptionTextColor, setSurveyOptionTextColor] = useState('#333333');
  const [surveyOptions, setSurveyOptions] = useState(['', '']);
  const [autoplay, setAutoplay] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loop, setLoop] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [videoProcessingStatus, setVideoProcessingStatus] = useState<'queued' | 'processing' | 'completed' | 'failed'>('queued');
  const [images, setImages] = useState<ImageListType>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
const { addNewPost } = useFeed();

  const handleChange = (panel: PostType) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
    if (isExpanded) {
      setPostType(panel);
    }
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setLoading(true);
      try {
        const result = await uploadPostVideo(files[0], content); // Updated upload logic
        const url = await getVideoUrl(result.blobName);
        setVideoUrl(url);
        setMediaUrl(url);
        setVideoProcessingStatus(result.processingStatus);
      } catch (error) {
        console.error('Error uploading video:', error);
        setError('Failed to upload video');
      } finally {
        setLoading(false);
      }
    }
  }, [content, uploadPostVideo, getVideoUrl]);

  const handleContentChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setContent(event.target.value);
  }, []);

  const getVideoDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
      };

      video.src = URL.createObjectURL(file);
    });
  }, []);

  const preparePostContent = useCallback(async (): Promise<PostContent | null> => {
    switch (postType) {
      case 'TEXT':
        return {
          text: content,
          backgroundColor,
          textColor,
          fontSize,
          alignment,
          fontWeight,
          padding,
          maxLines: 10,
        };
      case 'PHOTO':
        return {
          photos: images.map(img => img.dataURL).filter((url): url is string => url !== undefined),
          caption: content,
        };
      case 'VIDEO':
        if (file) {
          try {
            const result = await uploadPostVideo(file, content);
            const duration = await getVideoDuration(file);
            setMediaUrl(result.videoUrl);
            setVideoProcessingStatus(result.processingStatus);
            return {
              blobName: result.blobName,
              videoUrl: result.videoUrl,
              thumbnailUrl: result.thumbnailUrl,
              duration: duration.toString(),
              caption: content,
              processingStatus: result.processingStatus,
              autoplay,
              muted,
              loop,
            };
          } catch (error) {
            console.error('Error uploading video:', error);
            return null;
          }
        } else if (mediaUrl) {
          return {
            videoUrl: mediaUrl,
            caption: content,
            processingStatus: videoProcessingStatus,
            autoplay,
            muted,
            loop,
            duration: '0',
          };
        }
        return null;
      case 'MOOD':
        return { mood, color: moodColor };
      case 'SURVEY':
        return {
          question: content,
          options: surveyOptions.filter(option => option.trim() !== '').map(option => ({ text: option })),
          backgroundColor: surveyBackgroundColor,
          questionColor: surveyQuestionColor,
          optionTextColor: surveyOptionTextColor,
          showResults: false,
        };
      default:
        return null;
    }
  }, [postType, content, backgroundColor, textColor, fontSize, alignment, fontWeight, padding, images, file, uploadPostVideo, getVideoDuration, autoplay, muted, loop, mood, moodColor, surveyOptions, surveyBackgroundColor, surveyQuestionColor, surveyOptionTextColor]);

  const resetForm = useCallback(() => {
    setContent('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setMediaUrl('');
    setBackgroundColor('#FFFFFF');
    setMood('');
    setMoodColor('#000000');
    setSurveyOptions(['', '']);
    setAutoplay(false);
    setMuted(true);
    setLoop(false);
    setExpanded(false);
    setImages([]);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user) return;

    const preparedContent = await preparePostContent();
    if (!preparedContent) {
      console.error('Failed to prepare post content');
      return;
    }

    const newPost: PostData = {
      postType,
      content: preparedContent,
      userId: user.userId,
      username: `${user.firstName} ${user.lastName}`,
      userAvatar: user.avatarUrl || '',
      firstName: user.firstName,
      lastName: user.lastName,
      timestamp: new Date().toISOString(),
      tenantId: user.currentTenantId,
      tenantInfo: user.tenant ? { name: user.tenant.name, type: user.tenant.type } : undefined,
      type: user.accountType as UserAccountTypeEnum,
      reactionCounts: [],
      reactions: []
    };


      try {
    await createNewPost(newPost);
    await addNewPost(newPost); // Add this line
    if (onPostCreated) {
      await onPostCreated(newPost);
    }
  } catch (error) {
    console.error('Error creating post:', error);
      } finally {
        resetForm();
    }
  }, [user, postType, preparePostContent, createNewPost, onPostCreated, resetForm]);

  useEffect(() => {
    if (postType === 'VIDEO' && mediaUrl) {
      const simulateProcessing = async () => {
        setVideoProcessingStatus('processing');
        await new Promise(resolve => setTimeout(resolve, 3000));
        setVideoProcessingStatus('completed');
      };
      simulateProcessing();
    }
  }, [postType, mediaUrl]);

  const renderPostTypeContent = (type: PostType) => {
    switch (type) {
      case 'TEXT':
        return (
          <>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="What do you want to share?"
              value={content}
              onChange={handleContentChange}
            />
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                label="Background Color"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                sx={{ width: '100px' }}
              />
              <TextField
                label="Text Color"
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                sx={{ width: '100px' }}
              />
              <TextField
                select
                label="Font Size"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large')}
                sx={{ width: '120px' }}
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </TextField>
              <TextField
                select
                label="Alignment"
                value={alignment}
                onChange={(e) => setAlignment(e.target.value as 'left' | 'center' | 'right')}
                sx={{ width: '120px' }}
              >
                <MenuItem value="left">Left</MenuItem>
                <MenuItem value="center">Center</MenuItem>
                <MenuItem value="right">Right</MenuItem>
              </TextField>
              <TextField
                select
                label="Font Weight"
                value={fontWeight}
                onChange={(e) => setFontWeight(e.target.value as 'normal' | 'bold')}
                sx={{ width: '120px' }}
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="bold">Bold</MenuItem>
              </TextField>
              <TextField
                select
                label="Padding"
                value={padding}
                onChange={(e) => setPadding(e.target.value as 'small' | 'medium' | 'large')}
                sx={{ width: '120px' }}
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </TextField>
            </Box>
          </>
        );
      case 'PHOTO':
        return (
          <>
            <PhotoUploader
              images={images}
              onUpload={(imageList) => {
                setImages(imageList);
              }}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              placeholder="Add a caption..."
              value={content}
              onChange={handleContentChange}
              sx={{ mt: 2 }}
            />
          </>
        );
      case 'VIDEO':
        return (
          <>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Enter video URL or upload a file"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              sx={{ mb: 2 }}
            />
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              placeholder="Add a caption..."
              value={content}
              onChange={handleContentChange}
              sx={{ mt: 2 }}
            />
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={<Switch checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />}
                label="Autoplay"
              />
              <FormControlLabel
                control={<Switch checked={muted} onChange={(e) => setMuted(e.target.checked)} />}
                label="Muted"
              />
              <FormControlLabel
                control={<Switch checked={loop} onChange={(e) => setLoop(e.target.checked)} />}
                label="Loop"
              />
            </Box>
            {videoUrl && (
              <VideoCard
                id={`preview-${Date.now()}`} // Generate a temporary id for preview
                userId={user?.userId || ''}
                username={`${user?.firstName || ''} ${user?.lastName || ''}`}
                userAvatar={user?.avatarUrl || ''}
                timestamp={new Date().toISOString()}
                blobName=""
                videoUrl={videoUrl}
                duration="0:00"
                caption={content}
                processingStatus={videoProcessingStatus}
                autoplay={autoplay}
                muted={muted}
                loop={loop}
                userType={user?.accountType as UserAccountTypeEnum}
              />
            )}
            {loading && <CircularProgress />}
            {error && <Typography color="error">{error}</Typography>}
          </>
        );
      case 'MOOD':
        return (
          <>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="How are you feeling?"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            />
            <TextField
              fullWidth
              type="color"
              value={moodColor}
              onChange={(e) => setMoodColor(e.target.value)}
              sx={{ mt: 2 }}
            />
          </>
        );
      case 'SURVEY':
        return (
          <>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask a question..."
              value={content}
              onChange={handleContentChange}
              sx={{ mb: 2 }}
            />
            {surveyOptions.map((option, index) => (
              <TextField
                key={index}
                fullWidth
                variant="outlined"
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => {
                  const newOptions = [...surveyOptions];
                  newOptions[index] = e.target.value;
                  setSurveyOptions(newOptions);
                }}
                sx={{ mb: 1 }}
              />
            ))}
            <Button onClick={() => setSurveyOptions([...surveyOptions, ''])}>
              Add Option
            </Button>
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                label="Background Color"
                type="color"
                value={surveyBackgroundColor}
                onChange={(e) => setSurveyBackgroundColor(e.target.value)}
                sx={{ width: '100px' }}
              />
              <TextField
                label="Question Color"
                type="color"
                value={surveyQuestionColor}
                onChange={(e) => setSurveyQuestionColor(e.target.value)}
                sx={{ width: '100px' }}
              />
              <TextField
                label="Option Text Color"
                type="color"
                value={surveyOptionTextColor}
                onChange={(e) => setSurveyOptionTextColor(e.target.value)}
                sx={{ width: '100px' }}
              />
            </Box>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 4, overflow: 'hidden' }}>
      <Accordion expanded={expanded === 'TEXT'} onChange={handleChange('TEXT')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <TextIcon sx={{ mr: 1 }} />
          <Typography>Text Post</Typography>
        </AccordionSummary>
        <AccordionDetails>{renderPostTypeContent('TEXT')}</AccordionDetails>
      </Accordion>
      <Accordion expanded={expanded === 'PHOTO'} onChange={handleChange('PHOTO')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ImageIcon sx={{ mr: 1 }} />
          <Typography>Photo Post</Typography>
        </AccordionSummary>
        <AccordionDetails>{renderPostTypeContent('PHOTO')}</AccordionDetails>
      </Accordion>
      <Accordion expanded={expanded === 'VIDEO'} onChange={handleChange('VIDEO')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <VideoIcon sx={{ mr: 1 }} />
          <Typography>Video Post</Typography>
        </AccordionSummary>
        <AccordionDetails>{renderPostTypeContent('VIDEO')}</AccordionDetails>
      </Accordion>
      <Accordion expanded={expanded === 'MOOD'} onChange={handleChange('MOOD')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <MoodIcon sx={{ mr: 1 }} />
          <Typography>Mood Post</Typography>
        </AccordionSummary>
        <AccordionDetails>{renderPostTypeContent('MOOD')}</AccordionDetails>
      </Accordion>
      <Accordion expanded={expanded === 'SURVEY'} onChange={handleChange('SURVEY')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <SurveyIcon sx={{ mr: 1 }} />
          <Typography>Survey Post</Typography>
        </AccordionSummary>
        <AccordionDetails>{renderPostTypeContent('SURVEY')}</AccordionDetails>
      </Accordion>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {content.length} / 280
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!user || !content || !expanded}
        >
          Publish
        </Button>
      </Box>
    </Box>
  );
};

export default PostCreator;
