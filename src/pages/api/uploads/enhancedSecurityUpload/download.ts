// src/pages/api/uploads/enhancedSecurityUpload/download/[trackingId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { COSMOS_COLLECTIONS } from '@/UploadingSystem/constants/uploadConstants';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { BlobServiceClient } from '@azure/storage-blob';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { ErrorType, SystemError } from '@/MonitoringSystem/constants/errors';

export const config = {
    api: {
        responseLimit: false,
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const startTime = Date.now();
    const operationId = monitoringManager.logger.generateRequestId();

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

        const { trackingId } = req.query;
        if (!trackingId || Array.isArray(trackingId)) {
            throw new Error('Invalid tracking ID');
        }

        // Get upload record from database
        const { db } = await getCosmosClient();
        const collection = db.collection(COSMOS_COLLECTIONS.UPLOADS);
        const upload = await collection.findOne({ trackingId });

        if (!upload) {
            throw new Error('Upload not found');
        }

        // Verify user has access to this upload
        if (upload.userId !== decodedToken.userId && upload.tenantId !== decodedToken.tenantId) {
            throw new Error('Unauthorized access');
        }

        // Initialize Azure Blob Storage client
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING!
        );
        const containerClient = blobServiceClient.getContainerClient(
            process.env.AZURE_STORAGE_CONTAINER_NAME!
        );
        const blobClient = containerClient.getBlobClient(upload.blobPath);

        // Get blob properties
        const properties = await blobClient.getProperties();

        // Set response headers
        res.setHeader('Content-Type', properties.contentType || 'application/octet-stream');
        res.setHeader(
            'Content-Disposition', 
            `attachment; filename="${encodeURIComponent(upload.metadata.originalName)}"`
        );
        res.setHeader('Content-Length', properties.contentLength || 0);

        // Stream the blob content
        const downloadResponse = await blobClient.download();
        const readableStream = downloadResponse.readableStreamBody;
        
        if (!readableStream) {
            throw new Error('Failed to get download stream');
        }

        // Record metrics
        monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'upload_system',
            'file_download',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                trackingId,
                userId: decodedToken.userId,
                tenantId: decodedToken.tenantId,
                fileSize: properties.contentLength,
                duration: Date.now() - startTime
            }
        );

        // Pipe the stream to response
        readableStream.pipe(res);

        // Handle stream errors
        readableStream.on('error', (error) => {
            monitoringManager.logger.error(error, SystemError.STORAGE_OPERATION_FAILED as ErrorType, {
                trackingId,
                operationId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            // Only send error if headers haven't been sent
            if (!res.headersSent) {
                res.status(500).json({ 
                    error: 'Download failed', 
                    message: 'Failed to download file' 
                });
            }
        });

    } catch (error) {
        monitoringManager.logger.error(error, SystemError.STORAGE_OPERATION_FAILED as ErrorType, {
            operationId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        res.status(500).json({
            error: 'DOWNLOAD_FAILED',
            message: error instanceof Error ? error.message : 'Failed to download file',
            reference: operationId
        });
    }
}