// src/pages/api/posts/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '../../../constants/collections';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';
import { SystemError } from '@/MonitoringSystem/constants/errors';
import { Media, Post, PostDataRequest, PostType, Visibility } from '@/feature/posts/api/types';
import { PaginatedResponse } from '@/types/pagination';
import { transformDbPostToApi } from '@/feature/posts/utils/transformers/postTransformer'; // Import the transformer

export const config = {
  api: {
    bodyParser: false,
  },
};

// Allowed sort fields configuration
const ALLOWED_SORT_FIELDS = {
  '_id': '_id',
  'timestamp': 'timestamp',
  'createdAt': 'createdAt',
  'updatedAt': 'updatedAt'
} as const;

type AllowedSortField = keyof typeof ALLOWED_SORT_FIELDS;

// FormData parsing utility
const parseFormData = async (req: NextApiRequest) => {
  const form = formidable({
    multiples: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB limit
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({
        ...fields,
        media: files.media ? {
          urls: Array.isArray(files.media) 
            ? files.media.map(file => file.filepath)
            : [(files.media as formidable.File).filepath]
        } : undefined
      });
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestStartTime = Date.now();

  try {
    // Validate HTTP method
    if (!['GET', 'POST'].includes(req.method || '')) {
      const appError = monitoringManager.error.createError(
        'business',
        'METHOD_NOT_ALLOWED',
        `Method ${req.method} not allowed`,
        { method: req.method }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: {
          message: errorResponse.userMessage,
          type: 'METHOD_NOT_ALLOWED',
          reference: errorResponse.errorReference,
        },
        status: errorResponse.statusCode
      });
    }

    // Validate authorization token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_UNAUTHORIZED',
        'No token provided'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: {
          message: errorResponse.userMessage,
          type: 'AUTH_UNAUTHORIZED',
          reference: errorResponse.errorReference,
        },
        status: errorResponse.statusCode
      });
    }

    // Verify access token
    const decodedToken = verifyAccessToken(token);
    if (!decodedToken?.userId) {
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Invalid token'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: {
          message: errorResponse.userMessage,
          type: 'AUTH_TOKEN_INVALID',
          reference: errorResponse.errorReference,
        },
        status: errorResponse.statusCode
      });
    }

    // Get database connection
    const { db } = await getCosmosClient();
    if (!db) {
      const appError = monitoringManager.error.createError(
        'system',
        'DATABASE_CONNECTION_FAILED',
        'Database connection is not available'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: {
          message: errorResponse.userMessage,
          type: 'DATABASE_CONNECTION_FAILED',
          reference: errorResponse.errorReference,
        },
        status: errorResponse.statusCode
      });
    }

    const postsCollection = db.collection(COLLECTIONS.POSTS);

    // Handle GET request
      // Handle GET request
  if (req.method === 'GET') {
    console.log('GET request params:', {
      page: req.query.page,
      limit: req.query.limit,
      sortField: req.query.sortField,
      sortOrder: req.query.sortOrder,
      filter: req.query.filter
    });
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      const appError = monitoringManager.error.createError(
        'business',
        'VALIDATION_ERROR',
        'Invalid pagination parameters'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: {
          message: errorResponse.userMessage,
          type: 'VALIDATION_ERROR',
          reference: errorResponse.errorReference,
        },
        status: errorResponse.statusCode
      });
    }
    // Handle sorting
    const requestedSortField = req.query.sortField as string || 'createdAt';
    const sortField = ALLOWED_SORT_FIELDS[requestedSortField as AllowedSortField] || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;
    // Build query
    const query: Record<string, any> = {
      status: { $ne: 'deleted' }
    };
    // Handle filters
    if (req.query.filter) {
      try {
        const filterParams = typeof req.query.filter === 'string' 
          ? JSON.parse(req.query.filter)
          : req.query.filter;
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query[key] = value;
          }
        });
      } catch (err) {
        console.error('Filter parsing error:', err);
      }
    }
    try {
      console.log('Executing query:', {
        query,
        sortField,
        sortOrder,
        skip,
        limit
      });
      const [documents, totalCount] = await Promise.all([
        postsCollection
          .find(query)
          .sort({ [sortField]: sortOrder, _id: sortOrder })
          .skip(skip)
          .limit(limit)
          .toArray(),
        postsCollection.countDocuments(query)
      ]);
      const posts: Post[] = documents.map(doc => ({
        id: doc._id.toString(),
        userId: doc.userId,
        username: doc.username,
        type: doc.type,
        content: doc.content,
        media: doc.media,
        visibility: doc.visibility,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        timestamp: doc.timestamp,
        reactions: doc.reactions,
        commentCount: doc.commentCount,
        authorId: doc.authorId,
        userAccountType: doc.userAccountType,
        status: doc.status,
        isEdited: doc.isEdited,
        processingStatus: doc.processingStatus,
        tenantId: doc.tenantId,
        accountType: doc.accountType,
      }));
      const totalPages = Math.ceil(totalCount / limit);
      console.log('Query results:', {
        postsCount: posts.length,
        totalCount,
        totalPages,
        currentPage: page
      });
      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'pagination',
        'fetch_duration',
        Date.now() - requestStartTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          page,
          limit,
          totalItems: totalCount,
          itemsFetched: posts.length,
          userId: decodedToken.userId,
        }
      );
    const response: PaginatedResponse<Post> = {
      data: posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    };
      return res.status(200).json(response);
    } catch (err) {
      console.error('Database operation error:', err);
      // Handle sort field error
      if (err.message?.includes('index path corresponding to the specified order-by item is excluded')) {
        const appError = monitoringManager.error.createError(
          'business',
          'INVALID_SORT_FIELD',
          'The requested sort field is not indexed',
          { 
            requestedField: req.query.sortField,
            allowedFields: Object.keys(ALLOWED_SORT_FIELDS)
          }
        );
        const errorResponse = monitoringManager.error.handleError(appError);
        return res.status(errorResponse.statusCode).json({
          error: {
            message: `Invalid sort field. Allowed fields: ${Object.keys(ALLOWED_SORT_FIELDS).join(', ')}`,
            type: 'INVALID_SORT_FIELD',
            reference: errorResponse.errorReference,
          },
          status: errorResponse.statusCode
        });
      }
      const appError = monitoringManager.error.createError(
        'system',
        'DATABASE_OPERATION_FAILED',
        'Failed to fetch posts',
        { error: err }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: {
          message: errorResponse.userMessage,
          type: 'DATABASE_OPERATION_FAILED',
          reference: errorResponse.errorReference,
        },
        status: errorResponse.statusCode
      });
    }
  }

    // Handle POST request
    if (req.method === 'POST') {
      let postData: PostDataRequest;
      try {
        // Parse incoming request data
        if (req.headers['content-type']?.includes('multipart/form-data')) {
          const formData = await parseFormData(req) as { [key: string]: any };
          postData = {
            type: formData.type as PostType,
            content: JSON.parse(formData.content as string),
            media: formData.media,
            visibility: (formData.visibility as Visibility) || 'public'
          };
        } else {
          const rawData = await new Promise<string>((resolve) => {
            let data = '';
            req.on('data', chunk => { data += chunk });
            req.on('end', () => resolve(data));
          });
          postData = JSON.parse(rawData);
        }

        const { content, type, media } = postData;

        // Validate required fields
        if (!content || !type) {
          const missingFields = ['content', 'type'].filter((field) => !(field in postData) || !postData[field as keyof typeof postData]);
          const appError = monitoringManager.error.createError(
            'business',
            'VALIDATION_ERROR',
            'Missing required fields',
            { missingFields }
          );
          const errorResponse = monitoringManager.error.handleError(appError);
          return res.status(errorResponse.statusCode).json({
            error: {
              message: errorResponse.userMessage,
              type: 'VALIDATION_ERROR',
              reference: errorResponse.errorReference,
              errors: missingFields.map(field => ({
                field,
                message: `${field} is required`
              }))
            },
            status: errorResponse.statusCode
          });
        }

        // Validate post type
        const validTypes = ['TEXT', 'PHOTO', 'VIDEO', 'MOOD', 'SURVEY'];
        const normalizedType = type.toUpperCase();
        if (!validTypes.includes(normalizedType)) {
          const appError = monitoringManager.error.createError(
            'business',
            'VALIDATION_ERROR',
            'Invalid post type',
            { validTypes, providedType: type }
          );
          const errorResponse = monitoringManager.error.handleError(appError);
          return res.status(errorResponse.statusCode).json({
            error: {
              message: errorResponse.userMessage,
              type: 'VALIDATION_ERROR',
              reference: errorResponse.errorReference,
              errors: [{
                field: 'type',
                message: `Post type must be one of: ${validTypes.join(', ')}`
              }]
            },
            status: errorResponse.statusCode
          });
        }

        // Create new post document
        const newPost = {
          content,
          type: normalizedType,
          media,
          userId: decodedToken.userId,
          username: decodedToken.username || ['Anonymous', ''],
          userAvatar: decodedToken.avatar,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          reactions: [],
          commentCount: 0,
          authorId: decodedToken.userId,
          userAccountType: decodedToken.userAccountType,
          visibility: postData.visibility || 'public',
          status: 'published',
          isEdited: false,
          processingStatus: normalizedType === 'VIDEO' ? 'queued' : undefined,
        };

        try {
          const result = await postsCollection.insertOne(newPost);
          const createdPost = await postsCollection.findOne({ _id: result.insertedId });

          if (!createdPost) {
            throw new Error('Failed to fetch created post');
          }

          // Transform the document to match Post interface
          const transformedPost: Post = {
            id: createdPost._id.toString(),
            userId: createdPost.userId,
            username: createdPost.username,
            userAvatar: createdPost.userAvatar,
            type: createdPost.type,
            content: createdPost.content,
            media: createdPost.media,
            reactions: createdPost.reactions || [],
            commentCount: createdPost.commentCount || 0,
            authorId: createdPost.authorId,
            timestamp: createdPost.timestamp,
            accountType: createdPost.userAccountType,
            createdAt: createdPost.createdAt,
            updatedAt: createdPost.updatedAt,
            status: createdPost.status,
            visibility: createdPost.visibility,
            isEdited: createdPost.isEdited || false,
            lastEditedAt: createdPost.lastEditedAt,
            metadata: createdPost.metadata,
            tenantId: createdPost.tenantId,
          };

          monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'post',
            'create',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
              userId: decodedToken.userId,
              postType: normalizedType,
              duration: Date.now() - requestStartTime,
            }
          );

          // Return in the expected PostResponse format
          return res.status(201).json({
            data: transformDbPostToApi(transformedPost),
            message: 'Post created successfully'
          });

        } catch (error) {
          const appError = monitoringManager.error.createError(
            'system',
            'DATABASE_OPERATION_FAILED',
            'Failed to create post',
            { error }
          );
          const errorResponse = monitoringManager.error.handleError(appError);
          return res.status(errorResponse.statusCode).json({
            error: {
              message: errorResponse.userMessage,
              type: 'DATABASE_OPERATION_FAILED',
              reference: errorResponse.errorReference,
            },
            status: errorResponse.statusCode
          });
        }
      } catch (err) {
        const appError = monitoringManager.error.createError(
          'business',
          'INVALID_REQUEST_FORMAT',
          'Failed to parse request data',
          { error: err }
        );
        const errorResponse = monitoringManager.error.handleError(appError);
        return res.status(errorResponse.statusCode).json({
          error: {
            message: errorResponse.userMessage,
            type: 'INVALID_REQUEST_FORMAT',
            reference: errorResponse.errorReference,
          },
          status: errorResponse.statusCode
        });
      }
    }

  } catch (error) {
    const appError = AppError.isAppError(error)
      ? error
      : monitoringManager.error.createError(
          'system',
          'REQUEST_RESPONSE_ERROR',
          'Error in request or response handling',
          { error }
        );

    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'post',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: req.method === 'GET' ? 'fetchPosts' : 'createPost',
        errorType: SystemError.DATABASE_CONNECTION_FAILED,
        duration: Date.now() - requestStartTime,
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: {
        message: errorResponse.userMessage,
        type: 'REQUEST_RESPONSE_ERROR',
        reference: errorResponse.errorReference,
      },
      status: errorResponse.statusCode
    });
  }
}
