// src/types/AzureResources.ts
import { AzureResourceParams, ResourceName, Location, AzureWidgetType, DatabaseType} from './SharedAzureTypes';
import { 
  AzureResourceAutoscale, 
  AzureFunctionAutoscaleSettings, 
  AzureCosmosDBAutoscaleSettings, 
  AzureSQLDatabaseAutoscaleSettings, 
  AzureStorageAutoTierSettings,
} from './AzureAutoscale';


// Storage Account specific
export enum StorageReplicationType {
  LRS = 'LRS',
  GRS = 'GRS',
  RAGRS = 'RA-GRS',
  ZRS = 'ZRS',
  GZRS = 'GZRS',
  RAGZRS = 'RA-GZRS'
}

export enum StorageAccountTier {
  Standard = 'Standard',
  Premium = 'Premium'
}

export enum StorageAccountKind {
  StorageV2 = 'StorageV2',
  BlobStorage = 'BlobStorage',
  BlockBlobStorage = 'BlockBlobStorage',
  FileStorage = 'FileStorage'
}

export enum StorageAccountAccessTier {
  Hot = 'Hot',
  Cool = 'Cool'
}

export interface AzureStorageAccountParams extends AzureResourceParams {
  kind: StorageAccountKind;
  sku: {
    name: StorageReplicationType;
    tier: StorageAccountTier;
  };
  properties: {
    accessTier: StorageAccountAccessTier;
  };
  autoTierSettings?: AzureStorageAutoTierSettings;
}

// Database (Cosmos DB) specific
export enum DatabaseAccountKind {
  GlobalDocumentDB = 'GlobalDocumentDB',
  MongoDB = 'MongoDB',
  Parse = 'Parse'
}

export enum DatabaseConsistencyLevel {
  Strong = 'Strong',
  BoundedStaleness = 'BoundedStaleness',
  Session = 'Session',
  ConsistentPrefix = 'ConsistentPrefix',
  Eventual = 'Eventual'
}

export interface AzureDatabaseParams extends AzureResourceParams {
  kind: DatabaseAccountKind;
  properties: {
    consistencyPolicy: {
      defaultConsistencyLevel: DatabaseConsistencyLevel;
    };
  };
  autoscaleSettings?: AzureCosmosDBAutoscaleSettings;
}

export interface AzureSqlDatabaseParams extends AzureResourceParams {
  properties: {
    // SQL Database specific properties
  };
  autoscaleSettings?: AzureSQLDatabaseAutoscaleSettings;
}

// Function App specific
export enum FunctionRuntime {
  DotNet = 'dotnet',
  Node = 'node',
  Java = 'java',
  Python = 'python',
  PowerShell = 'powershell'
}

export enum FunctionPlanType {
  Consumption = 'Consumption',
  Premium = 'Premium',
  Dedicated = 'Dedicated',
  ElasticPremium = 'ElasticPremium'
}

export interface AzureFunctionParams extends AzureResourceParams {
  properties: {
    runtime: FunctionRuntime;
    sku: FunctionPlanType;
  };
  autoscaleSettings?: AzureFunctionAutoscaleSettings;
}

// Application Insights specific
export enum InsightsType {
  Web = 'web',
  Other = 'other'
}

export type InsightsRetentionPeriod = 30 | 60 | 90 | 120 | 180 | 270 | 365 | 550 | 730;

export interface InsightsParams extends AzureResourceParams {
  kind: InsightsType;
  properties: {
    RetentionInDays: InsightsRetentionPeriod;
  };
}

// Union type for all Azure resource parameters
export type AzureResourceParamsType =
  | AzureStorageAccountParams
  | AzureDatabaseParams
  | AzureFunctionParams
  | AzureSqlDatabaseParams
  | InsightsParams;

// Resource creation response
export interface AzureResourceResponse {
  id: string;
  name: string;
  type: string;
  location: Location;
  tags?: { [key: string]: string };
  properties: any; // This would be more specific based on the resource type
}
