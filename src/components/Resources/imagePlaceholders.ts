// src/utils/imagePlaceholders.ts

// Placeholder types
export type PlaceholderType = 'avatar' | 'cover' | 'thumbnail';

export interface PlaceholderConfig {
  width: number;
  height: number;
  text?: string;
  bgColor?: string;
  textColor?: string;
}

/**
 * Generate placeholder URLs using different services
 */
export const imagePlaceholder = {
  // Placeholder.com - Simple and fast
  placeholder: (config: PlaceholderConfig) => {
    const { width, height, text, bgColor = '1f2937', textColor = 'ffffff' } = config;
    return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  },

  // Picsum - Real stock photos
  picsum: (config: PlaceholderConfig) => {
    const { width, height } = config;
    return `https://picsum.photos/${width}/${height}`;
  },

  // DiceBear Avatars - For user avatars
  dicebear: (seed: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  },

  // UI Faces - For user avatars (alternative)
  uiFaces: () => {
    return 'https://faces.cloudinary.com/twitter/';
  }
};

// Predefined configurations
export const PLACEHOLDER_CONFIGS = {
  resourceCover: {
    width: 400,
    height: 250,
    bgColor: '1f2937',
    textColor: 'ffffff'
  },
  avatar: {
    width: 40,
    height: 40,
    bgColor: '4f46e5',
    textColor: 'ffffff'
  },
  thumbnail: {
    width: 150,
    height: 150,
    bgColor: '1f2937',
    textColor: 'ffffff'
  },
  cover: {
    width: 800,
    height: 600,
    bgColor: '1f2937',
    textColor: 'ffffff'
  }
};

/**
 * Get placeholder URL based on type
 */
export const getPlaceholderImage = (type: PlaceholderType, customConfig?: Partial<PlaceholderConfig>) => {
  const config = {
    ...PLACEHOLDER_CONFIGS[type],
    ...customConfig
  };

  // Choose different services based on type
  switch (type) {
    case 'avatar':
      return imagePlaceholder.dicebear(Math.random().toString());
    case 'cover':
      return imagePlaceholder.picsum(config);
    default:
      return imagePlaceholder.placeholder(config);
  }
};

// Helper for generating random avatars
export const getRandomAvatar = (userName: string) => {
  return imagePlaceholder.dicebear(userName);
};