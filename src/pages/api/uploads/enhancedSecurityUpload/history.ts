// src/pages/api/uploads/enhancedSecurityUpload/history.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { COSMOS_COLLECTIONS } from '@/UploadingSystem/constants/uploadConstants';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { ErrorType, IntegrationError, SystemError } from '@/MonitoringSystem/constants/errors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Verify token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new Error('Authentication required');
        }

        const decodedToken = await verifyAccessToken(token);
        if (!decodedToken?.userId) {
            throw new Error('Invalid token');
        }

        // Get query parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = req.query.status as string;
        const skip = (page - 1) * limit;

        // Build query
        const query: any = {
            userId: decodedToken.userId,
            tenantId: decodedToken.tenantId
        };

        if (status && status !== 'all') {
            query.status = status;
        }

        // Get database connection
        const { db } = await getCosmosClient();
        const collection = db.collection(COSMOS_COLLECTIONS.UPLOADS);

        // Execute queries
        const [items, totalCount] = await Promise.all([
            collection.find(query)
                .sort({ lastModified: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            collection.countDocuments(query)
        ]);

        // Transform items to include metadata
        const transformedItems = items.map(item => ({
            trackingId: item.trackingId,
            status: item.status,
            metadata: {
                originalName: item.metadata?.originalName || 'Unknown',
                fileSize: item.metadata?.fileSize || 0,
                category: item.metadata?.category || 'other',
                uploadedAt: item.createdAt,
                duration: item.duration,
                processingSteps: item.processingSteps
            },
            fileUrl: item.fileUrl,
            lastModified: item.lastModified,
            userId: item.userId,
            tenantId: item.tenantId,
            completedAt: item.completedAt
        }));

        // Record metrics
        monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'upload_system',
            'history_fetch',
            items.length,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                userId: decodedToken.userId,
                tenantId: decodedToken.tenantId,
                totalCount,
                page,
                limit
            }
        );

        return res.status(200).json({
            items: transformedItems,
            totalItems: totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            hasMore: skip + items.length < totalCount
        });

    } catch (error) {
        monitoringManager.logger.error(error, IntegrationError.API_REQUEST_FAILED as ErrorType, {
            endpoint: '/api/uploads/enhancedSecurityUpload/history',
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return res.status(500).json({
            error: 'Failed to fetch upload history',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}