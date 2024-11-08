import { Box, Typography } from "@mui/material";

// src/UploadingSystem/components/upload/SubSteps.tsx
interface SubStepsProps {
  steps: string[];
  isActive: boolean;
}

export const SubSteps: React.FC<SubStepsProps> = ({ steps, isActive }) => (
  <Box className="ml-6 space-y-2 mt-2">
    {steps.map((step, index) => (
      <Typography 
        key={index}
        className={`text-sm ${
          isActive ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        • {step}
      </Typography>
    ))}
  </Box>
);