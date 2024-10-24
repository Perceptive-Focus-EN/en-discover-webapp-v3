// src/lib/api_s/azureServiceManager.ts
import axiosInstance from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/azureConstants';
import { FrontendOperationParams, FrontendOperationResult } from '../../types/Azure/FrontendResourceOperations';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

class AzureServiceManager {
  private static instance: AzureServiceManager;

  private constructor() {}

  public static getInstance(): AzureServiceManager {
    if (!AzureServiceManager.instance) {
      AzureServiceManager.instance = new AzureServiceManager();
    }
    return AzureServiceManager.instance;
  }

  private getSuccessMessage(operation: string): string {
    const actionMap: Record<string, string> = {
      'Create': 'created',
      'Delete': 'deleted',
      'Update': 'updated',
      'List': 'retrieved',
      'Get': 'retrieved',
      'Upload': 'uploaded',
      'Download': 'downloaded'
    };

    const action = Object.keys(actionMap).find(key => operation.startsWith(key));
    if (!action) return 'Operation completed successfully';

    const resource = operation.replace(action, '').trim();
    return `${resource} ${actionMap[action]} successfully`;
  }

  async executeOperation(params: FrontendOperationParams): Promise<FrontendOperationResult> {
    let endpoint: string;
    let method: 'get' | 'post' | 'put' | 'delete' = 'post';
    let data: any = params;

    switch (params.operation) {
      // Storage operations
      case 'Create Storage Account':
      case 'Delete Storage Account':
      case 'Get Storage Account':
      case 'Update Storage Account':
      case 'List Storage Accounts':
        endpoint = API_ENDPOINTS.STORAGE[params.operation.toUpperCase().replace(/ /g, '_') as keyof typeof API_ENDPOINTS.STORAGE];
        method = params.operation === 'List Storage Accounts' ? 'get' : method;
        break;

      // Blob operations
      case 'Create Container':
      case 'Delete Container':
      case 'List Containers':
      case 'Get Container':
      case 'Upload Blob':
      case 'Download Blob':
      case 'Delete Blob':
      case 'List Blobs':
        endpoint = API_ENDPOINTS.BLOB[params.operation.toUpperCase().replace(/ /g, '_') as keyof typeof API_ENDPOINTS.BLOB];
        method = ['List Containers', 'Get Container', 'Download Blob', 'List Blobs'].includes(params.operation) ? 'get' : method;
        method = ['Delete Container', 'Delete Blob'].includes(params.operation) ? 'delete' : method;
        break;

      // Database operations
      case 'Create Database Account':
      case 'Delete Database Account':
      case 'List Database Accounts':
      case 'Get Database Account':
      case 'Update Database Account':
      case 'Create Database':
      case 'Delete Database':
      case 'List Databases':
      case 'Get Database':
      case 'Create Collection':
      case 'Delete Collection':
      case 'List Collections':
      case 'Get Collection':
        endpoint = API_ENDPOINTS.COSMOS[params.operation.toUpperCase().replace(/ /g, '_') as keyof typeof API_ENDPOINTS.COSMOS];
        method = ['List Database Accounts', 'Get Database Account', 'List Databases', 'Get Database', 'List Collections', 'Get Collection'].includes(params.operation) ? 'get' : method;
        method = ['Delete Database Account', 'Delete Database', 'Delete Collection'].includes(params.operation) ? 'delete' : method;
        break;

      // Function operations
      case 'Create Function App':
      case 'Delete Function App':
      case 'List Function Apps':
      case 'Get Function App':
      case 'Update Function App':
      case 'Create Function':
      case 'Delete Function':
      case 'List Functions':
      case 'Get Function':
        endpoint = API_ENDPOINTS.FUNCTIONS[params.operation.toUpperCase().replace(/ /g, '_') as keyof typeof API_ENDPOINTS.FUNCTIONS];
        method = ['List Function Apps', 'Get Function App', 'List Functions', 'Get Function'].includes(params.operation) ? 'get' : method;
        method = ['Delete Function App', 'Delete Function'].includes(params.operation) ? 'delete' : method;
        break;

      // Insights operations
      case 'Create Application Insights':
      case 'Delete Application Insights':
      case 'List Application Insights':
      case 'Get Application Insights':
      case 'Update Application Insights':
      case 'Create Insights Widget':
        const insightsOperation = params.operation.toUpperCase().replace(/ /g, '_') as keyof typeof API_ENDPOINTS.INSIGHTS;
        endpoint = API_ENDPOINTS.INSIGHTS[insightsOperation];
        method = ['List Application Insights', 'Get Application Insights'].includes(params.operation) ? 'get' : method;
        method = params.operation === 'Delete Application Insights' ? 'delete' : method;
        break;

      // Resource operations
      case 'Get Resource Details':
        endpoint = API_ENDPOINTS.RESOURCES.GET_DETAILS.replace(':resourceId', (params as any).resourceId);
        method = 'get';
        break;

      default:
        throw new Error(`Unsupported operation: ${params.operation}`);
    }

    const response = await axiosInstance({
      method,
      url: endpoint,
      data: method === 'get' ? undefined : data,
      params: method === 'get' ? data : undefined,
    });

    // Show success message for non-GET operations
    if (method !== 'get') {
      messageHandler.success(this.getSuccessMessage(params.operation));
    }

    return {
      success: true,
      data: response.data
    };
  }
}

export default AzureServiceManager.getInstance();