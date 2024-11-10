import React, { useState } from 'react';
import { 
    Box, 
    Container, 
    Paper, 
    Tabs, 
    Tab,
    Divider 
} from '@mui/material';
import ErrorBoundary from '@/components/ErrorBoundary';
import { uploadApi } from '@/lib/api/uploads';
import { FileCategory, UPLOAD_STATUS } from '@/UploadingSystem/constants/uploadConstants';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { FileDropzone } from '@/UploadingSystem/components/upload/FileDropzone';
import { UploadHistory } from '@/UploadingSystem/components/upload/UploadHistory';
import UploadFlowVisualization from '@/UploadingSystem/components/upload/UploadFlowVisualization';
import { SocketIOProgress } from '@/UploadingSystem/types/progress';
import { UploadStatus } from '@/UploadingSystem/constants/uploadConstants';
import { useAuth} from '../../contexts/AuthContext'
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <div role="tabpanel" hidden={value !== index}>
        {value === index && children}
    </div>
);

const UploadPage: React.FC = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
    const { user } = useAuth();

    const determineFileCategory = (file: File): FileCategory => {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('audio/')) return 'audio';
        if (file.type === 'application/pdf' ||
            file.type === 'application/msword' ||
            file.type.includes('document')) return 'document';
        return 'other';
    };

    const handleFileSelect = async (files: File[]) => {
        const file = files[0];
        if (!file) return;
        
        setIsUploading(true);
        try {
            const category = determineFileCategory(file);
            const response = await uploadApi.uploadFile(file, category);
            messageHandler.success('Upload started');
            
            setActiveUploadId(response.trackingId);
            setActiveTab(1);
        } catch (error) {
            messageHandler.error('Failed to start upload');
        } finally {
            setIsUploading(false);
        }
    };

    const handleProgress = (progress: SocketIOProgress) => {
        // Update page title
        document.title = `Upload ${Math.round(progress.progress)}% - Uploading`;

        // Handle status changes
        switch (progress.status) {
            case UPLOAD_STATUS.COMPLETED:
                messageHandler.success('Upload completed');
                setActiveUploadId(null);
                setActiveTab(2);
                break;
            case UPLOAD_STATUS.FAILED:
                messageHandler.error('Upload failed');
                setActiveUploadId(null);
                setActiveTab(2);
                break;
            case UPLOAD_STATUS.PROCESSING:
                messageHandler.info('Processing upload');
                break;
            case UPLOAD_STATUS.PAUSED:
                messageHandler.warning('Upload paused');
                break;
            case UPLOAD_STATUS.CANCELLED:
                messageHandler.warning('Upload cancelled');
                setActiveUploadId(null);
                setActiveTab(2);
                break;
            case UPLOAD_STATUS.UPLOADING:
                if (progress.uploadSpeed) {
                    messageHandler.info(`Upload speed: ${(progress.uploadSpeed / 1024 / 1024).toFixed(2)} MB/s`);
                }
                break;
        }
    };

    const handleViewUpload = (trackingId: string) => {
        setActiveUploadId(trackingId);
        setActiveTab(1);
    };

    return (
        <ErrorBoundary>
            <Container maxWidth="lg">
                <Box className="py-8">
                    <Paper elevation={3}>
                        <Tabs
                            value={activeTab}
                            onChange={(_, newValue) => setActiveTab(newValue)}
                            className="px-4"
                        >
                            <Tab label="Upload Files" />
                            {activeUploadId && <Tab label="Current Upload" />}
                            <Tab label="Upload History" />
                        </Tabs>
                        <Divider />

                        <TabPanel value={activeTab} index={0}>
                            <Box className="p-6">
                                <FileDropzone
                                    onFileSelect={handleFileSelect}
                                    isUploading={isUploading}
                                    accept={{
                                        'image/*': [],
                                        'video/*': [],
                                        'audio/*': [],
                                        'application/pdf': [],
                                        'application/msword': [],
                                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': []
                                    }}
                                />
                            </Box>
                        </TabPanel>

                        <TabPanel value={activeTab} index={1}>
                            {activeUploadId && (
                                <Box className="p-6">
                                    <UploadFlowVisualization
                                        trackingId={activeUploadId}
                                        onProgress={handleProgress}
                                    />
                                </Box>
                            )}
                        </TabPanel>
                         <TabPanel value={activeTab} index={2}>
                <Box className="p-6">
                    <UploadHistory
                        userId={user?.userId|| ''} // Pass actual user ID
                        onViewUpload={handleViewUpload}
                    />
                </Box>
                        </TabPanel>


                    </Paper>
                </Box>
            </Container>
        </ErrorBoundary>
    );
};

export default UploadPage;