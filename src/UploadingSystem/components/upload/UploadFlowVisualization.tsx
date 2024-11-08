// src/UploadingSystem/components/upload/UploadFlowVisualization.tsx
import React from 'react';
import { Box, Paper } from '@mui/material';
import { useUploadVisualization } from '../../hooks/useUploadVisualization';
import { FLOW_STEPS, VISUALIZATION_CONFIG } from '../../constants/uploadVisualization';
import { formatBytes, formatTime } from '../../utils/upload';
import { FlowStep } from './FlowStep';
import { UploadHeader } from './UploadHeader';
import { ProgressIndicator } from './ProgressIndicator';
import { SimulationButton } from './SimulationButton';
import { WebSocketProgress } from '@/UploadingSystem/types/progress';
import type { VisualizationStep } from '@/UploadingSystem/constants/uploadVisualization';


interface UploadFlowVisualizationProps {
    trackingId: string;
    onProgress: (progress: WebSocketProgress) => void;
}

const UploadFlowVisualization: React.FC<UploadFlowVisualizationProps> = ({ 
    trackingId, 
    onProgress 
}) => {
    const {
        progress,
        activeSteps,
        metrics,
        handleSimulateUpload
    } = useUploadVisualization({ trackingId, onProgress });

    const getChunkingSubSteps = (): string[] => [
        `${progress.chunksCompleted} of ${progress.totalChunks} chunks completed`,
        `${formatBytes(progress.uploadedBytes)} uploaded`,
        `Est. ${formatTime(progress.estimatedTimeRemaining)} remaining`
    ];

    const renderFlowStep = (step: typeof FLOW_STEPS[VisualizationStep]) => (
        <Box 
            key={step.id}
            className={step.id === VISUALIZATION_CONFIG.steps.CHUNKING.id ? 'ml-8' : ''}
        >
            <FlowStep
                {...step}
                isActive={activeSteps.has(step.id)}
                metrics={step.id === VISUALIZATION_CONFIG.steps.CHUNKING.id ? metrics : undefined}
                subSteps={
                    step.id === VISUALIZATION_CONFIG.steps.CHUNKING.id
                        ? getChunkingSubSteps()
                        : step.subSteps
                }
            />
        </Box>
    );

    return (
        <Box className="p-6 max-w-4xl mx-auto">
            <Paper elevation={3} className="p-6">
                <UploadHeader 
                    status={progress.status}
                    uploadSpeed={progress.uploadSpeed}
                />

                <ProgressIndicator 
                    progress={progress.progress}
                    chunksCompleted={progress.chunksCompleted}
                    totalChunks={progress.totalChunks}
                />

                <Box className="space-y-4">
                    {VISUALIZATION_CONFIG.order.map(stepKey => 
                        renderFlowStep(FLOW_STEPS[stepKey])
                    )}
                </Box>

                <SimulationButton
                    status={progress.status}
                    onClick={handleSimulateUpload}
                />
            </Paper>
        </Box>
    );
};

export default UploadFlowVisualization;