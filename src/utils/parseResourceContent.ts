import { ContentSection } from '@/components/Resources/ResourceContentViewer';
import { Resource } from '@/types/Resources/resources';

interface ParsedContent {
  title: string;
  sections: ContentSection[];
  references: any[]; // Adjust type as needed
  images: { url: string; alt: string }[];
}

export const parseResourceContent = (resource: Resource): ParsedContent => {
  const sections: ContentSection[] = [];

  // Text formatting utilities
  const parseInlineFormatting = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\_(.*?)\_/g, '<em>$1</em>')
      .replace(/\=\=(.*?)\=\=/g, '<mark>$1</mark>')
      .replace(/\`(.*?)\`/g, '<code>$1</code>');
  };

  type FontType = 'primary' | 'secondary';
  
  const getTextStyle = (text: string): { font: FontType; weight: number; isItalic: boolean; isBold: boolean; size: 'medium'; color: string } => ({
      font: 'primary' as FontType,
      weight: text.includes('**') ? 700 : 400,
      isItalic: text.includes('_'),
      isBold: text.includes('**'),
      size: 'medium' as const,
      color: text.startsWith('> ') ? 'primary' : 'text.secondary'
    });

  // Add abstract section
  sections.push({
    type: 'abstract',
    content: resource.abstract,
    textStyle: {
      font: 'primary',
      size: 'medium',
      weight: 400,
      color: 'text.secondary'
    }
  });

  // Process main content
  const contentParts = resource.content.split('\n\n');
  
  contentParts.forEach(part => {
    const trimmedPart = part.trim();
    
    if (!trimmedPart) return;

    // Headers
    const headerMatch = trimmedPart.match(/^(#{1,6})\s(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      sections.push({
        type: 'heading',
        content: headerMatch[2],
        level,
        textStyle: {
          font: 'primary',
          weight: level === 1 ? 800 : 700,
          size: level === 1 ? 'large' : 'medium',
          color: 'text.primary'
        }
      });
      return;
    }

    // Lists
    if (trimmedPart.match(/^[-*]\s/m)) {
      sections.push({
        type: 'list',
        items: trimmedPart
          .split('\n')
          .map(item => item.replace(/^[-*]\s/, ''))
          .map(parseInlineFormatting),
        content: '',
        textStyle: {
          font: 'primary',
          size: 'medium',
          weight: 400
        }
      });
      return;
    }

    // Quotes
    if (trimmedPart.startsWith('> ')) {
      sections.push({
        type: 'quote',
        content: parseInlineFormatting(trimmedPart.replace(/^>\s/, '')),
        textStyle: {
          font: 'primary',
          size: 'medium',
          weight: 400,
          isItalic: true,
          color: 'primary'
        }
      });
      return;
    }

    // Code blocks
    if (trimmedPart.startsWith('```')) {
      const match = trimmedPart.match(/^```(\w+)?\n([\s\S]+?)\n```$/);
      if (match) {
        sections.push({
          type: 'code',
          content: match[2],
          language: match[1] || 'text',
        textStyle: {
            font: 'secondary',
            size: 'medium',
            weight: 400
          }
        });
        return;
      }
    }

    // Regular text with inline formatting
    sections.push({
      type: 'text',
      content: parseInlineFormatting(trimmedPart),
      textStyle: getTextStyle(trimmedPart)
    });
  });

  // Add main image if exists
  if (resource.imageUrl) {
    sections.push({
      type: 'image',
      content: resource.imageUrl,
      caption: 'Featured image'
    });
  }

  return {
    title: resource.title,
    sections,
    references: [], // Add references handling if needed
    images: [{ url: resource.imageUrl, alt: resource.title }]
  };
};

// Helper function to estimate read time
export const calculateReadTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

// Helper function to validate content format
export const validateContentFormat = (content: string): string[] => {
  const errors: string[] = [];
  
  // Check for unclosed formatting tags
  if ((content.match(/\*\*/g) || []).length % 2 !== 0) {
    errors.push('Unclosed bold formatting (**) found');
  }
  if ((content.match(/\_/g) || []).length % 2 !== 0) {
    errors.push('Unclosed italic formatting (_) found');
  }
  if ((content.match(/\=\=/g) || []).length % 2 !== 0) {
    errors.push('Unclosed highlight formatting (==) found');
  }

  // Check for proper header format
  const invalidHeaders = content.match(/^#(?!\s).*$/gm);
  if (invalidHeaders) {
    errors.push('Headers must have a space after #');
  }

  return errors;
};

export const formatContentExample = `
# Main Title

## Introduction
This is a regular paragraph with **bold text** and _italic text_.

### Key Points
- First point with ==highlighted text==
- Second point with **bold** and _italic_ combinations
- Third point with \`inline code\`

> Important quote or callout text

## Code Example
\`\`\`typescript
const example = "This is a code block";
console.log(example);
\`\`\`

### Conclusion
Final thoughts and summary.
`;
