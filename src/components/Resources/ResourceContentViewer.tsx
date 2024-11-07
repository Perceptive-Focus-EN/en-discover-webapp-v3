// src/components/Resources/ResourceContentViewer.tsx
import React from 'react';
import {
    Typography,
    Box,
    CardMedia,
    Divider,
    Paper,
    List,
    ListItem,
    ListItemText,
    Chip,
    useTheme,
    useMediaQuery,
    Container
} from '@mui/material';
import { styled } from '@mui/system';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import ImageRenderer from '../../pages/ImageRenderer/ImageRenderer';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

export interface ResourceContentProps {
    content: {
        title: string;
        sections: ContentSection[];
        images?: ContentImage[];
        references?: Reference[];
    };
    author: {
        name: string;
        avatar: string;
        bio?: string;
    };
    metadata: {
        readTime: number;
        datePublished: string;
        categories: string[];
    };
}

export interface ContentSection {
    type: 'text' | 'heading' | 'list' | 'quote' | 'image' | 'code' | 'abstract';
    content: string;
    level?: number;
    items?: string[];
    caption?: string;
    language?: string;
    textStyle?: {
        isBold?: boolean;
        isItalic?: boolean;
        size?: 'small' | 'medium' | 'large';
        color?: string;
        font?: 'primary' | 'secondary';
        weight?: number;
    };
}

export interface ContentImage {
    url: string;
    caption?: string;
    alt?: string;
}

export interface Reference {
    title: string;
    url: string;
    author?: string;
}

const StyledArticleContainer = styled(Box)(({ theme }) => ({
    maxWidth: '100%',
    margin: '0 auto',
    [theme.breakpoints.up('md')]: {
        maxWidth: '768px',
    }
}));

const AbstractSection = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.grey[50],
    borderRadius: '24px',
    padding: theme.spacing(3),
    marginBottom: theme.spacing(4),
    '& .abstractTitle': {
        fontWeight: 'bold',
        marginBottom: theme.spacing(1),
        color: theme.palette.text.secondary
    },
    '& .abstractContent': {
        color: theme.palette.text.secondary,
        lineHeight: 1.6
    }
}));

const ContentBlock = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(4),
    '& .sectionTitle': {
        fontWeight: 'bold',
        fontSize: '1.5rem',
        marginBottom: theme.spacing(2),
        color: theme.palette.text.primary
    },
    '& .sectionContent': {
        color: theme.palette.text.secondary,
        lineHeight: 1.8,
        fontSize: '1rem',
        '& strong': {
            color: theme.palette.text.primary,
            fontWeight: 600
        }
    }
}));

const BlockQuote = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: theme.palette.primary.light,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    margin: theme.spacing(2, 0),
    '& p': {
        margin: 0,
        color: theme.palette.primary.dark,
        fontStyle: 'italic'
    }
}));

export const ResourceContentViewer: React.FC<ResourceContentProps> = ({
    content,
    author,
    metadata
}) => {
    console.log('ResourceContentViewer props:', { content, author, metadata });
    
        // Validate content structure
    if (!content || !Array.isArray(content.sections)) {
        console.error('Invalid content structure:', content);
        return (
            <Box p={3} textAlign="center">
                <Typography color="error">
                    Error: Invalid content structure
                </Typography>
            </Box>
        );
    }

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

const getTypographyStyles = (textStyle?: ContentSection['textStyle']) => {
    if (!textStyle) return {};

    const styles: React.CSSProperties = {};

    if (textStyle.isBold) styles.fontWeight = 'bold';
    if (textStyle.isItalic) styles.fontStyle = 'italic';
    if (textStyle.size) {
        switch (textStyle.size) {
            case 'small':
                styles.fontSize = '0.875rem';
                break;
            case 'medium':
                styles.fontSize = '1rem';
                break;
            case 'large':
                styles.fontSize = '1.25rem';
                break;
        }
    }
    if (textStyle.color) styles.color = textStyle.color;
    if (textStyle.font) {
        styles.fontFamily = textStyle.font === 'primary' ? 'Arial, sans-serif' : 'Georgia, serif';
    }
    if (textStyle.weight) styles.fontWeight = textStyle.weight;

    return styles;
};

const renderSection = (section: ContentSection, index: number) => {
    const typographyStyles = getTypographyStyles(section.textStyle);

        switch (section.type) {
            case 'heading':
                return (
                    <Typography
                        key={index}
                        variant={`h${section.level || 2}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'}
                        sx={{
                            ...typographyStyles,
                            mb: 2,
                            mt: section.level === 1 ? 4 : 3
                        }}
                    >
                        {section.content}
                    </Typography>
                );

                            case 'text':
                return (
                    <Typography
                        key={index}
                        component="div"
                        sx={{
                            ...typographyStyles,
                            mb: 2,
                            '& strong': {
                                fontWeight: 700,
                                color: theme.palette.text.primary
                            },
                            '& em': {
                                fontStyle: 'italic'
                            },
                            '& mark': {
                                backgroundColor: theme.palette.primary.light,
                                color: theme.palette.primary.main,
                                padding: '0 4px',
                                borderRadius: '4px'
                            }
                        }}
                        dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                );
                case 'abstract':
                    return (
                        <ContentBlock key={index}>
                            <ReactMarkdown
                                rehypePlugins={[rehypeRaw]}
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ children }) => (
                                        <Typography variant="body1" paragraph>
                                            {children}
                                        </Typography>
                                    ),
                                    a: ({ href, children }) => (
                                        <Typography
                                            component="a"
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            color="primary"
                                            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                        >
                                            {children}
                                        </Typography>
                                    ),
                                }}
                            >
                                {section.content}
                            </ReactMarkdown>
                        </ContentBlock>
                    );
            case 'list':
                return (
                    <ContentBlock key={index}>
                        <List>
                            {section.items?.map((item, i) => (
                                <ListItem key={i}>
                                    <ListItemText>
                                        <ReactMarkdown>{item}</ReactMarkdown>
                                    </ListItemText>
                                </ListItem>
                            ))}
                        </List>
                    </ContentBlock>
                );
            case 'quote':
                return (
                    <BlockQuote key={index}>
                        <Typography variant="body1">
                            {section.content}
                        </Typography>
                    </BlockQuote>
                );
            case 'image':
    return (
        <Box key={index} sx={{ my: 3 }}>
            {section.content ? (
                <>
                    <ImageRenderer
                        src={section.content}
                        alt={section.caption || 'Resource image'}
                        height={500}
                        width="100%"
                        objectFit="contain"
                        fallbackText="Failed to load resource image"
                        showLoadingIndicator={true}
                        onError={(error) => {
                            console.error('Image load error:', error);
                            monitoringManager.metrics.recordMetric(
                                MetricCategory.BUSINESS,
                                'resource_image_load',
                                'failure',
                                1,
                                MetricType.COUNTER,
                                MetricUnit.COUNT,
                                {
                                    error: error.message,
                                    imageUrl: section.content
                                }
                            );
                        }}
                        onLoad={() => {
                            monitoringManager.metrics.recordMetric(
                                MetricCategory.BUSINESS,
                                'resource_image_load',
                                'success',
                                1,
                                MetricType.COUNTER,
                                MetricUnit.COUNT,
                                {
                                    imageUrl: section.content
                                }
                            );
                        }}
                    />
                    {section.caption && (
                        <Typography 
                            variant="caption" 
                            align="center" 
                            display="block"
                            sx={{ 
                                mt: 1,
                                color: 'text.secondary',
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {section.caption}
                        </Typography>
                    )}
                </>
            ) : (
                <Typography 
                    color="error" 
                    align="center"
                    sx={{ my: 2 }}
                >
                    Image source not provided
                </Typography>
            )}
        </Box>
    );
            
            case 'code':
                return (
                    <ContentBlock key={index}>
                        <Paper
                            sx={{
                                p: 2,
                                backgroundColor: 'grey.900',
                                borderRadius: 2,
                                overflow: 'auto'
                            }}
                        >
                            <Typography component="pre" sx={{ fontFamily: 'monospace', color: 'common.white', m: 0 }}>
                                <code>{section.content}</code>
                            </Typography>
                        </Paper>
                        {section.caption && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                                {section.caption}
                            </Typography>
                        )}
                    </ContentBlock>
                );
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
            <StyledArticleContainer>
                {/* Header Section */}
                <Box mb={4}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        {content.title}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" gap={1}>
                            {metadata.categories.map(category => (
                                <Chip
                                    key={category}
                                    label={category}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                        <Typography color="text.secondary" fontWeight="bold">
                            {metadata.readTime} min read
                        </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={2}>
                        <CardMedia
                            component="img"
                            sx={{ width: 48, height: 48, borderRadius: '50%' }}
                            image={author.avatar}
                            alt={author.name}
                        />
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {author.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Published on {new Date(metadata.datePublished).toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Box>

                    {author.bio && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {author.bio}
                        </Typography>
                    )}
                </Box>

                <Divider sx={{ mb: 4 }} />

                {/* Content Sections */}
                {content.sections.map((section, index) => renderSection(section, index))}

                {/* References Section */}
                {content.references && content.references.length > 0 && (
                    <Box mt={4}>
                        <Typography variant="h6" gutterBottom>
                            References
                        </Typography>
                        <List>
                            {content.references.map((ref, index) => (
                                <ListItem key={index}>
                                    <ListItemText>
                                        <Typography
                                            component="a"
                                            href={ref.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            color="primary"
                                            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                        >
                                            {ref.title}
                                        </Typography>
                                        {ref.author && (
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                by {ref.author}
                                            </Typography>
                                        )}
                                    </ListItemText>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
            </StyledArticleContainer>
        </Container>
    );
};

export default ResourceContentViewer;
