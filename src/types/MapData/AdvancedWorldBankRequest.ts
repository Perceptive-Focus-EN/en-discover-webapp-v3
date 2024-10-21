
// Request to get data from the World Bank API with additional parameters like source and version 

import { WorldBankIndicatorRequest } from './WorldBankIndicatorRequest';


export interface AdvancedWorldBankRequest extends WorldBankIndicatorRequest {
    source?: number;
    version?: string;
}
  
