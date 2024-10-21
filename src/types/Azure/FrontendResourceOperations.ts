// src/types/Azure/FrontendResourceOperations.ts
import { AzureResourceType } from './SharedAzureTypes';
import { AzureResourceParamsType } from './AzureResources';
import {
  StorageAccountOperation,
  BlobStorageOperation,
  DatabaseOperation,
  FunctionOperation,
  InsightsOperation,
  AutoscaleOperation,
  ResourceOperation,
  StorageAccountOperationParams,
  BlobStorageOperationParams,
  DatabaseOperationParams,
  FunctionOperationParams,
  InsightsOperationParams,
  AutoscaleOperationParams,
  ResourceOperationParams,
  AzureOperation
} from './AzureOperations';

// Frontend Resource Operation type
export type FrontendResourceOperation = AzureOperation;

// Discriminated union for FrontendOperationParams
export type FrontendOperationParams =
  | (StorageAccountOperationParams & { resourceType: 'Storage'; operation: StorageAccountOperation })
  | (BlobStorageOperationParams & { resourceType: 'Storage'; operation: BlobStorageOperation })
  | (DatabaseOperationParams & { resourceType: 'CosmosDB' | 'SQLDatabase'; operation: DatabaseOperation })
  | (FunctionOperationParams & { resourceType: 'Function'; operation: FunctionOperation })
  | (InsightsOperationParams & { resourceType: 'Insights'; operation: InsightsOperation })
  | (AutoscaleOperationParams & { resourceType: AzureResourceType; operation: AutoscaleOperation })
  | (ResourceOperationParams & { resourceType: AzureResourceType; operation: ResourceOperation });

// Result interface for frontend operations
export interface FrontendOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Type for the execute operation function
export type ExecuteFrontendOperation = (
  params: FrontendOperationParams
) => Promise<FrontendOperationResult>;

// Helper types for specific operations using the discriminated union
export type StorageAccountFrontendOperation = Extract<FrontendOperationParams, { resourceType: 'Storage'; operation: StorageAccountOperation }>;
export type BlobStorageFrontendOperation = Extract<FrontendOperationParams, { resourceType: 'Storage'; operation: BlobStorageOperation }>;
export type DatabaseFrontendOperation = Extract<FrontendOperationParams, { resourceType: 'CosmosDB' | 'SQLDatabase'; operation: DatabaseOperation }>;
export type FunctionFrontendOperation = Extract<FrontendOperationParams, { resourceType: 'Function'; operation: FunctionOperation }>;
export type InsightsFrontendOperation = Extract<FrontendOperationParams, { resourceType: 'Insights'; operation: InsightsOperation }>;
export type AutoscaleFrontendOperation = Extract<FrontendOperationParams, { resourceType: AzureResourceType; operation: AutoscaleOperation }>;
export type ResourceFrontendOperation = Extract<FrontendOperationParams, { operation: ResourceOperation }>;