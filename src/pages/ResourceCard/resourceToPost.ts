// src/utils/adapters/resourceToPost.ts
import { Post, PostType, Visibility } from '@/feature/posts/api/types';
import { Resource, ResourceVisibility } from '@/types/ArticleMedia';
import {useAuth} from '../../contexts/AuthContext';


const mapResourceVisibilityToPostVisibility = (visibility: ResourceVisibility): Visibility => {
    switch (visibility) {
        case 'public':
            return 'public';
        case 'private':
            return 'private';
        case 'organization':
            return 'connections';
        default:
            throw new Error(`Unknown visibility: ${visibility}`);
    }
};

export const resourceToPost = (resource: Resource): Post => {
    const { user } = useAuth();
    if (!user) {
        throw new Error('User is not authenticated');
    }

    return {
        id: resource.id,
        type: PostType.TEXT, // Ensure 'PostType.TEXT' is a valid value for 'PostType'
        content: {
            text: resource.abstract,
            title: resource.title,
            backgroundColor: 'white',
            textColor: 'black',
            fontSize: 'medium',
            alignment: 'left'
        },
        authorId: resource.author.id || '',
        visibility: mapResourceVisibilityToPostVisibility(resource.visibility),
        createdAt: resource.datePublished,
        timestamp: resource.datePublished,
        userId: resource.author.id || '',
        tenantId: '', // Adjust this line based on the correct property or remove if not needed
        username: [
            user.firstName,
            user.lastName
        ],
        commentCount: 0,
        reactions: [],
        accountType: user.accountType, // Ensure 'user.accountType' is of type 'UserAccountTypeEnum'
        updatedAt: resource.datePublished, // Adjust this line based on the correct property
        status: 'draft', // Add appropriate value for status
    };
};