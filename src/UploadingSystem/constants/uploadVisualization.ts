// src/UploadingSystem/constants/uploadVisualization.ts
import { 
  Upload, Database, SplitSquareVertical, 
  Server, CheckCircle, Clock 
} from 'lucide-react';
import { UploadStatus, UPLOAD_STATUS } from './uploadConstants';
import { MuiChipColor } from '../types/mui';

// Define specific steps for visualization
export const VISUALIZATION_STEPS = {
  AUTH: 'AUTH',
  RECEPTION: 'RECEPTION',
  CONTEXT: 'CONTEXT',
  CHUNKING: 'CHUNKING',
  DATABASE: 'DATABASE',
  CACHE: 'CACHE'
} as const;

// Type for visualization steps
export type VisualizationStep = typeof VISUALIZATION_STEPS[keyof typeof VISUALIZATION_STEPS];

// Interface for flow step configuration
export interface FlowStepConfig {
  id: VisualizationStep;
  icon: React.ComponentType<{
    size?: string | number;
    className?: string;
  }>;
  label: string;
  subSteps: string[];
}

// Flow steps configuration
export const FLOW_STEPS: Record<VisualizationStep, FlowStepConfig> = {
  [VISUALIZATION_STEPS.AUTH]: {
    id: VISUALIZATION_STEPS.AUTH,
    icon: CheckCircle,
    label: 'Authentication & Authorization',
    subSteps: []
  },
  [VISUALIZATION_STEPS.RECEPTION]: {
    id: VISUALIZATION_STEPS.RECEPTION,
    icon: Upload,
    label: 'File Reception',
    subSteps: ['Formidable Processing']
  },
  [VISUALIZATION_STEPS.CONTEXT]: {
    id: VISUALIZATION_STEPS.CONTEXT,
    icon: Server,
    label: 'Upload Context/Tracking',
    subSteps: []
  },
  [VISUALIZATION_STEPS.CHUNKING]: {
    id: VISUALIZATION_STEPS.CHUNKING,
    icon: SplitSquareVertical,
    label: 'ChunkingService',
    subSteps: [] // Dynamic subSteps handled in component
  },
  [VISUALIZATION_STEPS.DATABASE]: {
    id: VISUALIZATION_STEPS.DATABASE,
    icon: Database,
    label: 'Database Service (Cosmos DB)',
    subSteps: ['Track upload progress']
  },
  [VISUALIZATION_STEPS.CACHE]: {
    id: VISUALIZATION_STEPS.CACHE,
    icon: Clock,
    label: 'Cache Service (Redis)',
    subSteps: ['Maintain upload state']
  }
} as const;

// Status color mapping
export const STATUS_COLORS: Partial<Record<UploadStatus, MuiChipColor>> = {
  [UPLOAD_STATUS.COMPLETED]: 'success',
  [UPLOAD_STATUS.FAILED]: 'error',
  [UPLOAD_STATUS.UPLOADING]: 'primary',
  [UPLOAD_STATUS.INITIALIZING]: 'default',
  [UPLOAD_STATUS.PAUSED]: 'default',
  [UPLOAD_STATUS.PROCESSING]: 'primary',
  [UPLOAD_STATUS.RESUMING]: 'primary'
} as const;

// Step order for visualization
export const STEP_ORDER: VisualizationStep[] = [
  VISUALIZATION_STEPS.AUTH,
  VISUALIZATION_STEPS.RECEPTION,
  VISUALIZATION_STEPS.CONTEXT,
  VISUALIZATION_STEPS.CHUNKING,
  VISUALIZATION_STEPS.DATABASE,
  VISUALIZATION_STEPS.CACHE
];

// Status to step mapping for automatic activation
export const STATUS_STEP_MAPPING: Record<UploadStatus, VisualizationStep[]> = {
  [UPLOAD_STATUS.INITIALIZING]: [VISUALIZATION_STEPS.AUTH],
  [UPLOAD_STATUS.UPLOADING]: [
    VISUALIZATION_STEPS.AUTH,
    VISUALIZATION_STEPS.RECEPTION,
    VISUALIZATION_STEPS.CHUNKING
  ],
  [UPLOAD_STATUS.PROCESSING]: [
    VISUALIZATION_STEPS.AUTH,
    VISUALIZATION_STEPS.RECEPTION,
    VISUALIZATION_STEPS.CHUNKING,
    VISUALIZATION_STEPS.DATABASE
  ],
  [UPLOAD_STATUS.COMPLETED]: [
    VISUALIZATION_STEPS.AUTH,
    VISUALIZATION_STEPS.RECEPTION,
    VISUALIZATION_STEPS.CHUNKING,
    VISUALIZATION_STEPS.DATABASE,
    VISUALIZATION_STEPS.CACHE
  ],
  [UPLOAD_STATUS.FAILED]: [],
  [UPLOAD_STATUS.PAUSED]: [],
  [UPLOAD_STATUS.RESUMING]: [],
  [UPLOAD_STATUS.CANCELLED]: []
} as const;

// Utility type for component props
export interface VisualizationConfig {
  steps: typeof FLOW_STEPS;
  colors: typeof STATUS_COLORS;
  order: typeof STEP_ORDER;
  statusMapping: typeof STATUS_STEP_MAPPING;
}

export const VISUALIZATION_CONFIG: VisualizationConfig = {
  steps: FLOW_STEPS,
  colors: STATUS_COLORS,
  order: STEP_ORDER,
  statusMapping: STATUS_STEP_MAPPING
} as const;