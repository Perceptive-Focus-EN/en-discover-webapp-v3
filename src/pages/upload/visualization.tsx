import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult, NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import ErrorBoundary from '@/components/ErrorBoundary';
import UploadFlowVisualization from '@/UploadingSystem/components/upload/UploadFlowVisualization';
import { SocketIOProgress } from '@/UploadingSystem/types/progress';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { UPLOAD_STATUS } from '@/UploadingSystem/constants/uploadConstants';
import { uploadApi } from '@/lib/api/uploads';

interface UploadVisualizationPageProps {
    defaultTrackingId: string | null;
}

const LoadingState: React.FC = () => (
    <Container maxWidth="lg">
        <Box className="p-8 text-center">
            <Typography variant="h6" color="textSecondary">
                Loading visualization...
            </Typography>
        </Box>
    </Container>
);

const UploadVisualizationPage: NextPage<UploadVisualizationPageProps> = ({ 
    defaultTrackingId 
}) => {
    const router = useRouter();
    const [trackingId, setTrackingId] = useState<string>(
        defaultTrackingId || (router.query.trackingId as string) || ''
    );

    useEffect(() => {
        // If accessed directly without trackingId, redirect to main upload page
        if (!trackingId && router.isReady) {
            const queryTrackingId = router.query.trackingId as string;
            if (!queryTrackingId) {
                router.push('/upload');
                return;
            }
            setTrackingId(queryTrackingId);
        }
    }, [router.isReady, router.query.trackingId, trackingId]);

    const handleProgress = (progress: SocketIOProgress) => {
        document.title = `Upload ${Math.round(progress.progress)}% - Visualization`;

        switch (progress.status) {
            case UPLOAD_STATUS.COMPLETED:
                messageHandler.success('Upload completed successfully');
                break;
            case UPLOAD_STATUS.FAILED:
                messageHandler.error(progress.error || 'Upload failed');
                break;
            case UPLOAD_STATUS.PAUSED:
                messageHandler.info('Upload paused');
                break;
            case UPLOAD_STATUS.RESUMING:
                messageHandler.info('Resuming upload...');
                break;
        }
    };

    if (!trackingId) {
        return <LoadingState />;
    }

    return (
        <ErrorBoundary>
            <Container maxWidth="lg">
                <Box className="py-8">
                    <Box className="mb-4">
                        <Button 
                            onClick={() => router.push('/upload')}
                            startIcon={<ArrowBack />}
                        >
                            Back to Upload
                        </Button>
                    </Box>
                    <UploadFlowVisualization
                        trackingId={trackingId}
                        onProgress={handleProgress}
                    />
                </Box>
            </Container>
        </ErrorBoundary>
    );
};

export const getServerSideProps: GetServerSideProps<UploadVisualizationPageProps> = async (
    context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<UploadVisualizationPageProps>> => {
    try {
        const { trackingId } = context.query;
        if (trackingId) {
            try {
                await uploadApi.getUploadStatus(trackingId as string);
            } catch {
                return {
                    redirect: {
                        destination: '/upload',
                        permanent: false,
                    },
                };
            }
        }

        return {
            props: {
                defaultTrackingId: typeof trackingId === 'string' ? trackingId : null,
            },
        };
    } catch (error) {
        console.error('Error in getServerSideProps:', error);
        return {
            props: {
                defaultTrackingId: null,
            },
        };
    }
};

export default UploadVisualizationPage;