import { 
  BlobServiceClient, 
  StorageSharedKeyCredential,
  BlockBlobClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol
} from '@azure/storage-blob';
import { AZURE_BLOB_STORAGE_CONFIG } from '../constants/azureConstants';

// Validate required configuration
const validateConfig = () => {
  const requiredVars = {
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_NAME,
    accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_KEY,
    containerName: AZURE_BLOB_STORAGE_CONFIG.CONTAINER_NAME,
    frontDoorEndpoint: process.env.AZURE_FRONT_DOOR_ENDPOINT
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  return requiredVars;
};

// Create shared credential instance
const createSharedKeyCredential = (): StorageSharedKeyCredential => {
  const config = validateConfig();
  return new StorageSharedKeyCredential(
    config.accountName,
    config.accountKey
  );
};

// Create blob service client
const createBlobServiceClient = (): BlobServiceClient => {
  const config = validateConfig();
  const credential = createSharedKeyCredential();
  
  const endpoint = config.frontDoorEndpoint 
    ? `https://${config.frontDoorEndpoint}`
    : `https://${config.accountName}.blob.core.windows.net`;

  return new BlobServiceClient(endpoint, credential);
};

// Create blob client through Front Door
export const createBlobClientWithFrontDoor = (blobName: string): BlockBlobClient => {
  const config = validateConfig();
  const blobServiceClient = createBlobServiceClient();
  
  return blobServiceClient
    .getContainerClient(config.containerName)
    .getBlockBlobClient(blobName);
};

// Generate SAS token with validation
export const generateSasToken = (blobName: string): string => {
  const config = validateConfig();
  const credential = createSharedKeyCredential();

  const sasOptions = {
    containerName: config.containerName,
    blobName: blobName,
    permissions: BlobSASPermissions.parse("r"),
    startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000),
    expiresOn: new Date(new Date().valueOf() + 24 * 60 * 60 * 1000),
    contentDisposition: 'inline',
    cacheControl: 'public, max-age=31536000',
    protocol: SASProtocol.Https
  };

  return generateBlobSASQueryParameters(
    sasOptions,
    credential
  ).toString();
};

// Generate blob URL with Front Door endpoint
export const generateBlobUrl = (blobName: string, sasToken?: string): string => {
  const config = validateConfig();
  const baseUrl = config.frontDoorEndpoint 
    ? `https://${config.frontDoorEndpoint}/${config.containerName}/${blobName}`
    : `https://${config.accountName}.blob.core.windows.net/${config.containerName}/${blobName}`;
    
  return sasToken ? `${baseUrl}?${sasToken}` : baseUrl;
};

let cachedCredentials: StorageSharedKeyCredential | null = null;
let lastCredentialRefresh = 0;
const CREDENTIAL_REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes

export const getAzureStorageCredentials = async (): Promise<StorageSharedKeyCredential> => {
  const config = validateConfig();
  const now = Date.now();

  if (!cachedCredentials || (now - lastCredentialRefresh) > CREDENTIAL_REFRESH_INTERVAL) {
    try {
      const credential = new StorageSharedKeyCredential(
        config.accountName,
        config.accountKey
      );

      // Test the credentials
      const blobServiceClient = new BlobServiceClient(
        `https://${config.accountName}.blob.core.windows.net`,
        credential
      );
      await blobServiceClient.getProperties();

      cachedCredentials = credential;
      lastCredentialRefresh = now;

      return credential;
    } catch (error) {
      throw new Error(`Failed to refresh Azure credentials: ${error.message}`);
    }
  }

  return cachedCredentials;
};
