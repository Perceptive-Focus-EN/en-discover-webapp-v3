// src/types/Azure/SharedAzureTypes.ts
import { StandardWidgetType } from '@/types/Widgets';

// Common fields
export type ResourceName = string; // 3-24 characters, lowercase letters and numbers only

export enum Location {
  EastUS = 'eastus',
  EastUS2 = 'eastus2',
  WestUS = 'westus',
  WestUS2 = 'westus2',
  WestUS3 = 'westus3',
  NorthCentralUS = 'northcentralus',
  SouthCentralUS = 'southcentralus',
  WestCentralUS = 'westcentralus',
  CentralUS = 'centralus',
  NorthEurope = 'northeurope',
  WestEurope = 'westeurope',
  UKSouth = 'uksouth',
  UKWest = 'ukwest',
  FranceCentral = 'francecentral',
  FranceSouth = 'francesouth',
  GermanyWestCentral = 'germanywestcentral',
  SwitzerlandNorth = 'switzerlandnorth',
  SwitzerlandWest = 'switzerlandwest',
  NorwayEast = 'norwayeast',
  NorwayWest = 'norwaywest',
  SoutheastAsia = 'southeastasia',
  EastAsia = 'eastasia',
  AustraliaCentral = 'australiacentral',
  AustraliaCentral2 = 'australiacentral2',
  AustraliaEast = 'australiaeast',
  AustraliaSoutheast = 'australiasoutheast',
  JapanEast = 'japaneast',
  JapanWest = 'japanwest',
  KoreaCentral = 'koreacentral',
  KoreaSouth = 'koreasouth',
  SouthIndia = 'southindia',
  CentralIndia = 'centralindia',
  WestIndia = 'westindia',
  CanadaCentral = 'canadacentral',
  CanadaEast = 'canadaeast',
  BrazilSouth = 'brazilsouth',
  BrazilSoutheast = 'brazilsoutheast',
  SouthAfricaNorth = 'southafricanorth',
  SouthAfricaWest = 'southafricawest',
  UAENorth = 'uaenorth',
  UAECentral = 'uaecentral',
  ChinaEast = 'chinaeast',
  ChinaNorth = 'chinanorth',
  ChinaEast2 = 'chinaeast2',
  ChinaNorth2 = 'chinanorth2',
  ChinaNorth3 = 'chinanorth3',
  GermanyCentral = 'germanycentral',
  GermanyNortheast = 'germanynortheast',
  USGovVirginia = 'usgovvirginia',
  USGovIowa = 'usgoviowa',
  USGovArizona = 'usgovarizona',
  USGovTexas = 'usgovtexas',
  USDoD = 'usdod',
  USSecWest = 'ussecwest',
  USSecEast = 'usseceast'
}

// Define the shared AzureResourceType
// src/types/Azure/SharedAzureTypes.ts


export type AzureResourceType = 'Storage' | 'CosmosDB' | 'SQLDatabase' | 'Function' | 'Insights';

export type AzureWidgetType = Extract<StandardWidgetType, 'StorageWidget' | 'DatabaseWidget' | 'FunctionWidget' | 'InsightsWidget'>;

export type DatabaseType = 'CosmosDB' | 'SQLDatabase';

export interface AzureResourceTypeInfo {
  widgetType: AzureWidgetType;
  subType?: DatabaseType;
}

export const resourceTypeToWidgetInfo: Record<AzureResourceType, AzureResourceTypeInfo> = {
  'Storage': { widgetType: 'StorageWidget' },
  'CosmosDB': { widgetType: 'DatabaseWidget', subType: 'CosmosDB' },
  'SQLDatabase': { widgetType: 'DatabaseWidget', subType: 'SQLDatabase' },
  'Function': { widgetType: 'FunctionWidget' },
  'Insights': { widgetType: 'InsightsWidget' }
};

export const widgetTypeToResourceTypes: Record<AzureWidgetType, AzureResourceType[]> = {
  'StorageWidget': ['Storage'],
  'DatabaseWidget': ['CosmosDB', 'SQLDatabase'],
  'FunctionWidget': ['Function'],
  'InsightsWidget': ['Insights']
};

export function getResourceType(widgetType: AzureWidgetType, subType?: DatabaseType): AzureResourceType {
  if (widgetType === 'DatabaseWidget' && subType) {
    return subType;
  }
  return widgetTypeToResourceTypes[widgetType][0];
}


// You can also move other shared types here, such as:
export interface AzureResourceParams {
  name: ResourceName;
  location: Location;
  tags?: { [key: string]: string };
  kind?: string;
  sku?: {
    name?: string;
    tier?: string;
  };
  properties?: {
    [key: string]: any;
  };
  identity?: {
    type: 'SystemAssigned' | 'UserAssigned' | 'SystemAssigned,UserAssigned' | 'None';
    userAssignedIdentities?: { [key: string]: {} };
  };
}

export interface AzureResourceResponse {
  id: string;
  name: string;
  type: string;
  location: Location;
  tags?: { [key: string]: string };
  properties: any; // This would be more specific based on the resource type
}