// src/pages/api/resources/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { validateResource } from '@/types/ArticleMedia';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { BusinessError, SecurityError, SystemError } from '@/MonitoringSystem/constants/errors';
import { COLLECTIONS } from '@/constants/collections';
import { AppError } from '@/MonitoringSystem/managers/AppError';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        reference?: string;
    };
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb'
        }
    }
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>
) {
    const operationId = monitoringManager.logger.generateRequestId();
    const startTime = Date.now();

    try {
        // Validate request method
        if (!['GET', 'POST'].includes(req.method!)) {
            res.setHeader('Allow', ['GET', 'POST']);
            throw monitoringManager.error.createError(
                'business',
                BusinessError.INVALID_METHOD,
                'Method not allowed',
                { method: req.method }
            );
        }

        // Authentication
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw monitoringManager.error.createError(
                'security',
                SecurityError.AUTH_TOKEN_MISSING,
                'Authentication required'
            );
        }

        const decodedToken = await verifyAccessToken(token);
        if (!decodedToken?.userId) {
            throw monitoringManager.error.createError(
                'security',
                SecurityError.AUTH_TOKEN_INVALID,
                'Invalid token provided'
            );
        }

        // Route handling
        const handler = {
            GET: handleGet,
            POST: handlePost
        }[req.method!];

        if (!handler) {
            throw monitoringManager.error.createError(
                'business',
                BusinessError.INVALID_METHOD,
                'Method not allowed',
                { method: req.method }
            );
        }
        const response = await handler(req, res, decodedToken, operationId);

        // Record success metric
        monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'api_request',
            'success',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                method: req.method,
                endpoint: '/api/resources',
                duration: Date.now() - startTime,
                operationId
            }
        );

        return response;

    } catch (error) {
        // Log error
        monitoringManager.logger.error(
            error instanceof Error ? error : new Error('Unknown error'),
           SecurityError.API_REQUEST_FAILED,
            {
                operationId,
                duration: Date.now() - startTime,
                method: req.method,
                url: req.url
            }
        );

        // Record error metric
        monitoringManager.metrics.recordMetric(
            MetricCategory.SYSTEM,
            'api_error',
            'occurred',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                method: req.method,
                endpoint: '/api/resources',
                errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
                reference: operationId
            }
        );

        // Process error through ErrorManager
        const errorResponse = monitoringManager.error.handleError(error);

        return res.status(errorResponse.statusCode).json({
            success: false,
            error: {
                code: errorResponse.errorType,
                message: errorResponse.userMessage,
                reference: errorResponse.errorReference
            }
        });
    }
}

async function handleGet(
    req: NextApiRequest,
    res: NextApiResponse,
    decodedToken: any,
    operationId: string
) {
    const startTime = Date.now();
    const { page = '1', limit = '10', ...filters } = req.query;

    try {
        // Validate query parameters
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        
        if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
            throw monitoringManager.error.createError(
                'business',
                BusinessError.INVALID_PARAMETERS,
                'Invalid pagination parameters',
                { page, limit }
            );
        }

        const { db } = await getCosmosClient();
        if (!db) {
            throw monitoringManager.error.createError(
                'system',
                SystemError.DATABASE_CONNECTION_FAILED,
                'Failed to connect to database'
            );
        }

        const collection = db.collection(COLLECTIONS.RESOURCES);

        // Build query with security context
        const query = {
            tenantId: decodedToken.tenantId,
            ...(filters.category && { category: filters.category }),
            ...(filters.status && { status: filters.status }),
            ...(filters.searchTerm && {
                $or: [
                    { title: { $regex: filters.searchTerm, $options: 'i' } },
                    { abstract: { $regex: filters.searchTerm, $options: 'i' } }
                ]
            })
        };

        const [resources, total] = await Promise.all([
            collection.find(query)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .toArray(),
            collection.countDocuments(query)
        ]);

        // Record success metrics
        monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'resources',
            'fetch_success',
            resources.length,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                operationId,
                duration: Date.now() - startTime,
                filterCount: Object.keys(filters).length,
                total
            }
        );

        return res.status(200).json({
            success: true,
            data: resources,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        throw monitoringManager.error.createError(
            'system',
            SystemError.DATABASE_OPERATION_FAILED,
            'Failed to fetch resources',
            { operationId, error }
        );
    }
}

async function handlePost(
    req: NextApiRequest,
    res: NextApiResponse,
    decodedToken: any,
    operationId: string
) {
    const startTime = Date.now();

    try {
        // Validate request body
        if (!req.body || Object.keys(req.body).length === 0) {
            throw monitoringManager.error.createError(
                'business',
              BusinessError.VALIDATION_FAILED,
                'Request body is required',
                { operationId }
            );
        }

        // Log incoming request
        monitoringManager.logger.info('Resource creation initiated', {
            operationId,
            userId: decodedToken.userId,
            tenantId: decodedToken.tenantId
        });

        // Prepare resource data
        const resourceData = {
            ...req.body,
            id: uuidv4(),
            tenantId: decodedToken.tenantId,
            createdBy: decodedToken.userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
            rating: 0,
            votes: 0,
            interactions: {
                isBookmarked: false,
                viewCount: 0,
                shareCount: 0,
                bookmarkCount: 0
            }
        };

        // Validate resource data
        try {
            if (!validateResource(resourceData)) {
                throw monitoringManager.error.createError(
                    'business',
                    BusinessError.VALIDATION_FAILED,
                    'Resource validation failed',
                    { 
                        operationId,
                        resourceData: {
                            title: resourceData.title,
                            category: resourceData.category
                        }
                    }
                );
            }
        } catch (validationError) {
            throw monitoringManager.error.createError(
                'business',
                BusinessError.VALIDATION_FAILED,
                'Resource validation failed',
                {
                    operationId,
                    originalError: validationError,
                    resourceData: {
                        title: resourceData.title,
                        category: resourceData.category
                    }
                }
            );
        }

        // Database operations
        const { db } = await getCosmosClient();
        if (!db) {
            throw monitoringManager.error.createError(
                'system',
                SystemError.DATABASE_CONNECTION_FAILED,
                'Failed to connect to database'
            );
        }

        const collection = db.collection(COLLECTIONS.RESOURCES);
        const result = await collection.insertOne(resourceData);

        if (!result.insertedId) {
            throw monitoringManager.error.createError(
                'system',
                SystemError.DATABASE_OPERATION_FAILED,
                'Failed to insert resource'
            );
        }

        // Record success metrics
        monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'resources',
            'create_success',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                operationId,
                duration: Date.now() - startTime,
                resourceId: resourceData.id
            }
        );

        // Log success
        monitoringManager.logger.info('Resource created successfully', {
            operationId,
            resourceId: result.insertedId.toString(),
            duration: Date.now() - startTime
        });

        return res.status(201).json({
            success: true,
            data: {
                ...resourceData,
                _id: result.insertedId
            }
        });

    } catch (error) {
        // Record failure metrics
        monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'resources',
            'create_failure',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                operationId,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            }
        );

        // Process through ErrorManager and rethrow
        const processedError = monitoringManager.error.handleError(error);
        throw new AppError({
            type: processedError.errorType,
            message: processedError.userMessage,
            statusCode: processedError.statusCode,
            errorReference: processedError.errorReference,
            tenantId: processedError.tenantId,
            metadata: {
                ...processedError.metadata,
                operationId,
                duration: Date.now() - startTime
            }
        });
    }
}