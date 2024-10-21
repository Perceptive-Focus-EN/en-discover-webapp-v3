// src/types/AzureAutoscale.ts
import { AzureResourceType } from './SharedAzureTypes';

export interface AzureAutoscaleSettings {
  enabled: boolean;
  minCapacity: number;
  maxCapacity: number;
}

export interface AzureFunctionAutoscaleSettings extends AzureAutoscaleSettings {
  planType: AzureFunctionPlanType;
  // For Premium plan
  minInstances?: number;
  maxInstances?: number;
}

export type AzureFunctionPlanType = 'Consumption' | 'Premium';

export interface AzureCosmosDBAutoscaleSettings extends AzureAutoscaleSettings {
  // Capacity is measured in Request Units (RUs)
}

export interface AzureSQLDatabaseAutoscaleSettings extends AzureAutoscaleSettings {
  scalingType: AzureSQLScalingType;
}

export type AzureSQLScalingType = 'DTU' | 'vCore';

export interface AzureStorageAutoTierSettings {
  enableAutoTierToHotFromCool: boolean;
  // Other auto-tiering settings as needed
}

export type AzureResourceAutoscaleSettings = 
  | AzureFunctionAutoscaleSettings
  | AzureCosmosDBAutoscaleSettings
  | AzureSQLDatabaseAutoscaleSettings
  | AzureStorageAutoTierSettings;

export interface AzureAutoscaleRule {
  metricTrigger: {
    metricName: string;
    metricResourceUri: string;
    timeGrain: string;
    statistic: 'Average' | 'Min' | 'Max' | 'Sum';
    timeWindow: string;
    timeAggregation: 'Average' | 'Minimum' | 'Maximum' | 'Total' | 'Count';
    operator: 'Equals' | 'NotEquals' | 'GreaterThan' | 'GreaterThanOrEqual' | 'LessThan' | 'LessThanOrEqual';
    threshold: number;
  };
  scaleAction: {
    direction: 'Increase' | 'Decrease';
    type: 'ChangeCount' | 'PercentChangeCount' | 'ExactCount';
    value: string;
    cooldown: string;
  };
}

export interface AzureAutoscaleProfile {
  name: string;
  capacity: AzureAutoscaleSettings;
  rules: AzureAutoscaleRule[];
}

export interface AzureResourceAutoscale {
  resourceId: string;
  resourceType: AzureResourceType;
  settings: AzureResourceAutoscaleSettings;
  profiles: AzureAutoscaleProfile[];
}


    