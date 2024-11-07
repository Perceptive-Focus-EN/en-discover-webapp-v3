// src/utils/adapters/resourceToPost.ts
import { Post } from '@/feature/posts/api/types';
import { Resource } from '@/types/ArticleMedia';

export const resourceToPost = (resource: Resource): Post => {
    return {
        id: resource.id,
        type: 'TEXT',
        content: {
            text: resource.abstract,
            title: resource.title,
            backgroundColor: 'white',
            textColor: 'black',
            fontSize: 'medium',
            alignment: 'left'
        },
        author: {
            id: resource.author.id || '',
            name: resource.author.name,
            avatar: resource.author.avatar
        },
        visibility: resource.visibility,
        createdAt: resource.datePublished,
        metrics: {
            views: resource.interactions?.viewCount || 0,
            shares: resource.interactions?.shareCount || 0,
            bookmarks: resource.interactions?.bookmarkCount || 0
        }
    };
};