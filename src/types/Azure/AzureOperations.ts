// src/types/AzureOperations.ts
import { AzureStorageAccountParams, AzureDatabaseParams, AzureFunctionParams, InsightsParams } from './AzureResources';
import { AzureResourceAutoscaleSettings } from './AzureAutoscale';
import { ResourceName, Location } from './SharedAzureTypes';


// Autoscale Operations
export type AutoscaleOperation =
  | 'Configure Autoscale'
  | 'Get Autoscale Settings'
  | 'Update Autoscale Settings'
  | 'Enable Autoscale'
  | 'Disable Autoscale';

// Storage Account Operations
export type StorageAccountOperation =
  | 'Create Storage Account'
  | 'Delete Storage Account'
  | 'List Storage Accounts'
  | 'Get Storage Account'
  | 'Update Storage Account';

  // Blob Storage Operations
export type BlobStorageOperation =
  | 'Create Container'
  | 'Delete Container'
  | 'List Containers'
  | 'Get Container'
  | 'Upload Blob'
  | 'Download Blob'
  | 'Delete Blob'
  | 'List Blobs';

// Database Operations (Cosmos DB)
export type DatabaseOperation = 
  | 'Create Database Account'
  | 'Delete Database Account'
  | 'List Database Accounts'
  | 'Get Database Account'
  | 'Update Database Account'
  | 'Create Database'
  | 'Delete Database'
  | 'List Databases'
  | 'Get Database'
  | 'Create Collection'  // Added this
  | 'Delete Collection'  // Added this
  | 'List Collections'   // Added this
  | 'Get Collection';    // Added this

  // Function Operations
export type FunctionOperation = 
  | 'Create Function App'
  | 'Delete Function App'
  | 'List Function Apps'
  | 'Get Function App'
  | 'Update Function App'
  | 'Create Function'
  | 'Delete Function'
  | 'List Functions'
  | 'Get Function';

  // Insights Operations
export type InsightsOperation = 
  | 'Create Application Insights'
  | 'Delete Application Insights'
  | 'List Application Insights'
  | 'Get Application Insights'
  | 'Update Application Insights'
  | 'Create Insights Widget';  // Added this

// Resource Operations
export type ResourceOperation =
  | 'Get Resource Details';  // Added this

export type AzureOperation =
  | StorageAccountOperation
  | BlobStorageOperation
  | DatabaseOperation
  | FunctionOperation
  | InsightsOperation
  | AutoscaleOperation
  | ResourceOperation;  // Added this

// Operation Parameters
export interface StorageAccountOperationParams extends Partial<AzureStorageAccountParams> {
  accountName?: ResourceName;
}

export interface BlobStorageOperationParams {
  accountName: ResourceName;
  containerName?: string;
  blobName?: string;
  content?: string | Blob;
}

export interface DatabaseOperationParams extends Partial<AzureDatabaseParams> {
  accountName?: ResourceName;
  databaseName?: string;
  containerName?: string;
}

export interface FunctionOperationParams extends Partial<AzureFunctionParams> {
  appName?: ResourceName;
  functionName?: string;
  functionCode?: string;
}

export interface InsightsOperationParams extends Partial<InsightsParams> {
  resourceName?: ResourceName;
}

export interface AutoscaleOperationParams {
  resourceId: string;
  resourceType: 'Function' | 'CosmosDB' | 'SQLDatabase' | 'Storage';
  settings?: AzureResourceAutoscaleSettings;
}

export interface ResourceOperationParams {
  resourceId: string;
}

export type AzureOperationParams =
  | StorageAccountOperationParams
  | BlobStorageOperationParams
  | DatabaseOperationParams
  | FunctionOperationParams
  | InsightsOperationParams
  | AutoscaleOperationParams
  | ResourceOperationParams;

// Operation Lists
export const storageAccountOperations: StorageAccountOperation[] = [
  'Create Storage Account',
  'Delete Storage Account',
  'List Storage Accounts',
  'Get Storage Account',
  'Update Storage Account'
];

export const blobStorageOperations: BlobStorageOperation[] = [
  'Create Container',
  'Delete Container',
  'List Containers',
  'Get Container',
  'Upload Blob',
  'Download Blob',
  'Delete Blob',
  'List Blobs'
];

export const databaseOperations: DatabaseOperation[] = [
  'Create Database Account',
  'Delete Database Account',
  'List Database Accounts',
  'Get Database Account',
  'Update Database Account',
  'Create Database',
  'Delete Database',
  'List Databases',
  'Get Database',
  'Create Collection',  // Added this
  'Delete Collection',  // Added this
  'List Collections',   // Added this
  'Get Collection'      // Added this
];

export const functionOperations: FunctionOperation[] = [
  'Create Function App',
  'Delete Function App',
  'List Function Apps',
  'Get Function App',
  'Update Function App',
  'Create Function',
  'Delete Function',
  'List Functions',
  'Get Function'
];

export const insightsOperations: InsightsOperation[] = [
  'Create Application Insights',
  'Delete Application Insights',
  'List Application Insights',
  'Get Application Insights',
  'Update Application Insights',
  'Create Insights Widget'  // Added this
];

export const autoscaleOperations: AutoscaleOperation[] = [
  'Configure Autoscale',
  'Get Autoscale Settings',
  'Update Autoscale Settings',
  'Enable Autoscale',
  'Disable Autoscale'
];

export const resourceOperations: ResourceOperation[] = [
  'Get Resource Details'
];
