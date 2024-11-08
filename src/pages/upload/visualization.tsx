// src/pages/upload/visualization.tsx
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import ErrorBoundary from '@/components/ErrorBoundary';
import UploadFlowVisualization from '@/UploadingSystem/components/upload/UploadFlowVisualization';
import { WebSocketProgress } from '@/UploadingSystem/types/progress';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { UPLOAD_STATUS } from '@/UploadingSystem/constants/uploadConstants';
import { uploadApi } from '@/lib/api/uploads';

interface UploadVisualizationPageProps {
    defaultTrackingId: string | null;
}

const LoadingState: React.FC = () => (
    <Container maxWidth="lg">
        <Box 
            className="p-8 text-center"
            display="flex"
            justifyContent="center"
            alignItems="center"
        >
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
        if (!trackingId && router.isReady) {
            const queryTrackingId = router.query.trackingId as string;
            if (queryTrackingId) {
                setTrackingId(queryTrackingId);
            } else {
                messageHandler.error('No tracking ID provided');
                router.push('/upload');
            }
        }
    }, [router.isReady, router.query.trackingId, trackingId]);

    const handleProgress = async (progress: WebSocketProgress) => {
        document.title = `Upload ${Math.round(progress.progress)}% - Upload Visualization`;

        switch (progress.status) {
            case UPLOAD_STATUS.COMPLETED:
                messageHandler.success('Upload completed successfully');
                // Optionally redirect or update UI
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
                    <UploadFlowVisualization
                        trackingId={trackingId}
                        onProgress={handleProgress}
                    />
                </Box>
            </Container>
        </ErrorBoundary>
    );
};

import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

interface ServerSideProps {
    defaultTrackingId: string | null;
}

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
    context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<ServerSideProps>> => {
    try {
        const { trackingId } = context.query;
        if (trackingId) {
            // Optional: Validate tracking ID exists
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