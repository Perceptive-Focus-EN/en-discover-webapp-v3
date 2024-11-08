// src/UploadingSystem/components/upload/FlowStep.tsx
import { UploadMetrics } from "@/UploadingSystem/types/chunking";
import { VisualizationStep } from "@/UploadingSystem/constants/uploadVisualization";
import { StepHeader } from "./StepHeader";
import { Box } from "@mui/material";
import { SubSteps } from "./SubSteps";

interface FlowStepProps {
    id: VisualizationStep;
    icon: React.ComponentType<{
        size?: string | number;
        className?: string;
    }>;  // Match the type from FlowStepConfig
    label: string;
    subSteps?: string[];
    isActive: boolean;
    metrics?: Partial<UploadMetrics>;
}

export const FlowStep: React.FC<FlowStepProps> = ({
    icon: Icon,
    label,
    subSteps = [],
    isActive,
    metrics
}) => {
    return (
        <Box className={`p-4 border rounded-lg ${
            isActive ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
        } transition-all duration-300`}>
            <StepHeader 
                Icon={Icon} 
                label={label} 
                isActive={isActive} 
                metrics={metrics} 
            />
            {subSteps.length > 0 && (
                <SubSteps steps={subSteps} isActive={isActive} />
            )}
        </Box>
    );
};