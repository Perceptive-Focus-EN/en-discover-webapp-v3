// File path: src/storage/azureBlobStorage.ts

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  ContainerClient,
} from '@azure/storage-blob';
import { AZURE_BLOB_STORAGE_CONFIG, AZURE_BLOB_SAS_CONFIG } from '../constants/azureConstants';
import { UploadResponse } from '@/types/Resources/api';
import { File } from 'formidable';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Interface to define the AzureBlobStorage instance type
export interface IAzureBlobStorage {
  uploadFile: (file: File, blobName: string) => Promise<UploadResponse>; // Change return type
  uploadBlob: (blobName: string, data: Buffer) => Promise<string>;
  deleteBlob: (blobName: string) => Promise<void>;
  downloadBlob: (blobName: string) => Promise<Buffer>;
  listBlobs: (prefix: string) => Promise<{ name: string }[]>;
  createContainer: () => Promise<void>;
}

// Enhanced SAS token generator with caching and content type control
export function generateSasToken(blobName: string): string {
  const sharedKeyCredential = new StorageSharedKeyCredential(
    AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_NAME,
    AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_KEY
  );

  const sasOptions = {
    containerName: AZURE_BLOB_STORAGE_CONFIG.CONTAINER_NAME,
    blobName: blobName,
    permissions: BlobSASPermissions.parse("r"), // Read permission only
    startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000), // 5 minutes ago
    expiresOn: new Date(new Date().valueOf() + 24 * 60 * 60 * 1000), // 24 hours validity
    contentDisposition: 'inline', // Ensure content renders inline
    cacheControl: 'public, max-age=31536000'
  };

  return generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
}

export class AzureBlobStorage implements IAzureBlobStorage {
  public static instance: AzureBlobStorage;
  public blobServiceClient: BlobServiceClient;
  public containerClient: ContainerClient;

  private constructor() {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_NAME,
      AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_KEY
    );
    this.blobServiceClient = new BlobServiceClient(
      `https://${AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_NAME}.blob.core.windows.net`,
      sharedKeyCredential
    );
    this.containerClient = this.blobServiceClient.getContainerClient(AZURE_BLOB_STORAGE_CONFIG.CONTAINER_NAME);
  }

  public static getInstance(): AzureBlobStorage {
    if (typeof window !== 'undefined') {
      throw new Error('AzureBlobStorage should not be instantiated on the client-side');
    }
    if (!AzureBlobStorage.instance) {
      AzureBlobStorage.instance = new AzureBlobStorage();
    }
    return AzureBlobStorage.instance;
  }

  // File upload method with enhanced SAS token generation and headers
// Updated uploadFile method with enforced headers for inline display

public async uploadFile(file: File, blobName: string): Promise<UploadResponse> {
  try {
    const data = await fs.promises.readFile(file.filepath);
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    // Updated blobOptions with explicit headers for inline display
    const blobOptions = {
      blobHTTPHeaders: {
        blobContentType: file.mimetype || 'application/octet-stream',
        blobContentDisposition: 'inline',
        blobCacheControl: 'public, max-age=31536000',
        blobContentLanguage: 'en-US',
      },
    };

    await blockBlobClient.uploadData(data, blobOptions);
    console.log(`File ${blobName} uploaded successfully.`);

    const sasToken = generateSasToken(blobName);
    const fileUrl = `${blockBlobClient.url}?${sasToken}`;

    // Clean up temporary file
    try {
      await fs.promises.unlink(file.filepath);
    } catch (error) {
      console.error('Error cleaning up temporary file:', error);
    }

    // Fixed response structure to avoid nested data object
    const uploadResponse: UploadResponse = {
      data: {
        url: fileUrl,  // Direct URL string, not nested object
        type: file.mimetype?.includes('image/') ? 'image' : 'video',
        size: file.size,
        filename: file.originalFilename || '',
        processingStatus: undefined,
        metadata: {
          originalName: file.originalFilename || '',
          mimeType: file.mimetype || '',
          uploadedAt: new Date().toISOString()
        }
      },
      message: 'File uploaded successfully'
    };

    console.log('Upload response:', uploadResponse);
    return uploadResponse;

  } catch (error) {
    console.error('Failed to upload file:', error);
    throw new Error('Failed to upload file to Azure Blob Storage');
  }
}


  // Container creation with explicit private access level
  public async createContainer(): Promise<void> {
    const exists = await this.containerClient.exists();
    if (!exists) {
      await this.containerClient.create({
        access: 'container',
      });
      console.log(`Container ${this.containerClient.containerName} created with private access.`);
    } else {
      console.log(`Container ${this.containerClient.containerName} already exists.`);
    }
  }

  // Other blob operations remain the same
  public async listBlobs(prefix: string): Promise<{ name: string }[]> {
    const blobs: { name: string }[] = [];
    for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
      blobs.push({ name: blob.name });
    }
    return blobs;
  }

  public async uploadBlob(blobName: string, data: Buffer): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(data);
    console.log(`Blob ${blobName} uploaded successfully.`);
    return blockBlobClient.url;
  }

  public async deleteBlob(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
    console.log(`Blob ${blobName} deleted successfully.`);
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream | undefined): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      if (!readableStream) {
        reject(new Error('Readable stream is undefined'));
        return;
      }
      const chunks: Buffer[] = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

  public async downloadBlob(blobName: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const downloadBlockBlobResponse = await blockBlobClient.download();
    const downloaded = await this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
    console.log(`Blob ${blobName} downloaded successfully.`);
    return downloaded;
  }
}

// Singleton export for AzureBlobStorage instance
export const azureBlobStorageInstance: IAzureBlobStorage | null =
  typeof window === 'undefined' ? AzureBlobStorage.getInstance() : null;

// <---------------------- END ---------------------->

import { StorageManagementClient } from '@azure/arm-storage';
import { DefaultAzureCredential } from '@azure/identity';
import { AZURE_SUBSCRIPTION_ID, AZURE_RESOURCE_GROUP } from '../constants/azureConstants';

export async function createStorageAccount(name: string, location: string, replication: string) {
  const credential = new DefaultAzureCredential();
  const client = new StorageManagementClient(credential, AZURE_SUBSCRIPTION_ID);

  const parameters = {
    sku: {
      name: replication,
    },
    kind: 'StorageV2',
    location: location,
  };

  await client.storageAccounts.beginCreateAndWait(AZURE_RESOURCE_GROUP, name, parameters);
  console.log(`Storage account ${name} created successfully in ${location}`);
}
