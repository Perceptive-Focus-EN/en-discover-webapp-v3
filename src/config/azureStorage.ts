import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";
import { AZURE_BLOB_STORAGE_CONFIG, AZURE_BLOB_SAS_CONFIG } from '../constants/azureConstants';
import type { ContainerClient } from "@azure/storage-blob";

export function generateSasToken(blobName: string): string {
  const sharedKeyCredential = new StorageSharedKeyCredential(AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_NAME, AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_KEY);
  const sasToken = generateBlobSASQueryParameters({
    containerName: AZURE_BLOB_STORAGE_CONFIG.CONTAINER_NAME,
    blobName: blobName,
    permissions: BlobSASPermissions.parse(AZURE_BLOB_SAS_CONFIG.PERMISSIONS),
    expiresOn: new Date(new Date().valueOf() + AZURE_BLOB_SAS_CONFIG.EXPIRATION_MINUTES * 60 * 1000), // Expiration time
  }, sharedKeyCredential).toString();
  return sasToken;
}

export class AzureBlobStorage {
  public static instance: AzureBlobStorage;
  public blobServiceClient: BlobServiceClient;
  public containerClient: ContainerClient;

  private constructor() {
    const sharedKeyCredential = new StorageSharedKeyCredential(AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_NAME, AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_KEY);
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

  async listBlobs(prefix: string): Promise<{ name: string }[]> {
    const blobs: { name: string }[] = [];
    for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
      blobs.push({ name: blob.name });
    }
    return blobs;
  }

  async createContainer(): Promise<void> {
    const exists = await this.containerClient.exists();
    if (!exists) {
      await this.containerClient.create();
      console.log(`Container ${this.containerClient.containerName} created.`);
    } else {
      console.log(`Container ${this.containerClient.containerName} already exists.`);
    }
  }

  async uploadBlob(blobName: string, data: Buffer): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(data);
    console.log(`Blob ${blobName} uploaded successfully.`);
  }

  async deleteBlob(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
    console.log(`Blob ${blobName} deleted successfully.`);
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream | undefined): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      if (!readableStream) {
        reject(new Error("Readable stream is undefined"));
        return;
      }
      const chunks: Buffer[] = [];
      readableStream.on("data", (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on("error", reject);
    });
  }

  async downloadBlob(blobName: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const downloadBlockBlobResponse = await blockBlobClient.download();
    const downloaded = await this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
    console.log(`Blob ${blobName} downloaded successfully.`);
    return downloaded;
  }
}

let azureBlobStorageInstance: AzureBlobStorage | null = null;

if (typeof window === 'undefined') {
  azureBlobStorageInstance = AzureBlobStorage.getInstance();
}

export default azureBlobStorageInstance;

// <---------------------- END ----------------------> 

import { StorageManagementClient } from "@azure/arm-storage";
import { DefaultAzureCredential } from "@azure/identity";
import { AZURE_SUBSCRIPTION_ID, AZURE_RESOURCE_GROUP } from '../constants/azureConstants';

export async function createStorageAccount(name: string, location: string, replication: string) {
  const credential = new DefaultAzureCredential();
  const client = new StorageManagementClient(credential, AZURE_SUBSCRIPTION_ID);

  const parameters = {
    sku: {
      name: replication, // Use replication options such as "Standard_LRS", "Standard_GRS", etc.
    },
    kind: "StorageV2", // This is an example; choose the appropriate storage account kind
    location: location,
  };

  await client.storageAccounts.beginCreateAndWait(AZURE_RESOURCE_GROUP, name, parameters);
  console.log(`Storage account ${name} created successfully in ${location}`);
}

