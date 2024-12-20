import { generateSasToken } from "../config/azureStorage";
import { BlobServiceClient } from "@azure/storage-blob"
import jwt from 'jsonwebtoken';
import { verifyEmailToken } from './TokenManagement/serverTokenUtils';
import { redisService } from '../services/cache/redisService';

const EMAIL_VERIFICATION_PREFIX = 'email_verification:';
const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

export function generateAvatarUrl(userId: string, tenantId: string): string {
    const blobName = `${tenantId}/avatars/${userId}/avatar.png`;
    const sasToken = generateSasToken(blobName);
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
    const containerClient = blobServiceClient.getContainerClient('mirapatientsdatastorage');
    return `https://${blobServiceClient.accountName}.blob.core.windows.net/${containerClient.containerName}/${blobName}?${sasToken}`;
}

interface EmailVerificationPayload {
    userId: string;
    email: string;
}

export function generateEmailVerificationToken(payload: EmailVerificationPayload): string {
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
    return token;
}

export async function setEmailVerificationToken(userId: string, token: string): Promise<void> {
    await redisService.setValue(`${EMAIL_VERIFICATION_PREFIX}${userId}`, token, EMAIL_VERIFICATION_EXPIRY);
}

export { verifyEmailToken };

// Add other email-related utility functions here