import { UploadMetrics } from "@/UploadingSystem/types/chunking";
import { VisualizationStep } from "@/UploadingSystem/constants/uploadVisualization";
import { StepHeader } from "./StepHeader";
import { Box, Tooltip } from "@mui/material";
import { SubSteps } from "./SubSteps";

interface FlowStepProps {
    id: VisualizationStep;
    icon: React.ComponentType<{
        size?: string | number;
        className?: string;
    }>;
    label: string;
    subSteps?: string[];
    isActive: boolean;
    metrics?: Partial<UploadMetrics>;
    onClick?: () => void;
    tooltip?: string;
}

export const FlowStep: React.FC<FlowStepProps> = ({
    icon: Icon,
    label,
    subSteps = [],
    isActive,
    metrics,
    onClick,
    tooltip
}) => {
    return (
        <Tooltip title={tooltip || ''} arrow>
            <Box
                className={`flow-step-container p-4 border rounded-lg ${
                    isActive ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                } transition-all duration-300 hover:shadow-lg cursor-pointer`}
                onClick={onClick}
            >
                <StepHeader 
                    Icon={Icon} 
                    label={label} 
                    isActive={isActive} 
                    metrics={metrics} 
                />
                {subSteps.length > 0 && (
                    <Box className="mt-4">
                        <SubSteps steps={subSteps} isActive={isActive} />
                    </Box>
                )}
            </Box>
        </Tooltip>
    );
};