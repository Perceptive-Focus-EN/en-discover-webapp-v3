import { UploadMetrics } from "@/UploadingSystem/types/chunking";
import { Box, Chip, Typography, Tooltip } from "@mui/material";

interface StepHeaderProps {
    Icon: React.ComponentType<{
        size?: string | number;
        className?: string;
    }>;  // Matches FlowStepConfig icon type from uploadVisualization.ts
    label: string;
    isActive: boolean;
    metrics?: Partial<UploadMetrics>;  // Matches FlowStep's metrics type
}

export const StepHeader: React.FC<StepHeaderProps> = ({
    Icon,
    label,
    isActive,
    metrics
}) => (
    <Box className="flex items-center justify-between p-2">
        <Box className="flex items-center gap-2">
            <Icon 
                size={20} 
                className={isActive ? 'text-blue-500' : 'text-gray-400'} 
            />
            <Typography 
                className={`font-semibold ${
                    isActive ? 'text-blue-700' : 'text-gray-600'
                }`}
            >
                {label}
            </Typography>
        </Box>
        {metrics?.metadata?.uploadStats?.chunkProgress !== undefined && (
            <Tooltip title="Upload Progress">
                <Chip 
                    size="small"
                    label={`${Math.round(metrics.metadata.uploadStats.chunkProgress)}%`}
                    color={isActive ? "primary" : "default"}
                />
            </Tooltip>
        )}
    </Box>
);