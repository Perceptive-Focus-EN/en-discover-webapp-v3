import React, { useCallback, useEffect, useState, useRef } from 'react';
import UserConnectionListItem from './UserConnectionListItem';
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    Snackbar,
    Alert,
    useMediaQuery,
    useTheme,
} from '@mui/material';

// Mock data (keep as is)
const mockConnections = Array.from({ length: 50 }, (_, i) => ({
    userId: `user-${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
    age: Math.floor(Math.random() * 50) + 20,
    tag: 'Patients',
    mood: ['Happy', 'Sad', 'Excited', 'Calm'][Math.floor(Math.random() * 4)],
    isFriend: Math.random() > 0.5,
}));

const BATCH_SIZE = 20;

interface Connection {
    userId: string;
    name: string;
    email: string;
    avatar: string;
    age: number;
    tag: string;
    mood: string;
    isFriend: boolean;
}

const SuggestedConnections = () => {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchConnections = useCallback(() => {
        setLoading(true);
        setError(null);
        setTimeout(() => {
            const newConnections = mockConnections.slice(
                connections.length,
                connections.length + BATCH_SIZE
            );
            setConnections((prev) => [...prev, ...newConnections]);
            setLoading(false);
        }, 1000);
    }, [connections.length]);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    const handleConnect = useCallback(async (userId: string) => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            setMessage('Connection request sent successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Failed to send connection request');
            setTimeout(() => setMessage(''), 3000);
        }
    }, []);

    const handleMoreOptions = useCallback((userId: string) => {
        console.log('More options for user:', userId);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading) {
                    fetchConnections();
                }
            },
            {
                root: null,
                rootMargin: '0px',
                threshold: 0.1,
            }
        );

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [fetchConnections, loading]);

    if (error) {
        return <Typography color="error">Error: {error}</Typography>;
    }

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'background.paper',
                boxShadow: 3,
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                }}
            >
                <Typography variant="h6">Suggested Connections</Typography>
                <Button color="primary" size="small">
                    See All
                </Button>
            </Box>

            {/* Message */}
            {message && (
                <Snackbar
                    open={Boolean(message)}
                    autoHideDuration={3000}
                    onClose={() => setMessage('')}
                >
                    <Alert severity="success">{message}</Alert>
                </Snackbar>
            )}

            {/* Content */}
            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: isMobile ? 'row' : 'column',
                    overflowX: isMobile ? 'auto' : 'hidden',
                    overflowY: isMobile ? 'hidden' : 'auto',
                    p: 2,
                }}
            >
                {connections.map((connection) => (
                    <UserConnectionListItem
                        key={connection.userId}
                        connection={connection}
                        onConnect={() => handleConnect(connection.userId)}
                        onMoreOptions={() => handleMoreOptions(connection.userId)}
                        isMobile={isMobile}
                    />
                ))}
                {/* Sentinel element for infinite scrolling */}
                <Box ref={sentinelRef} sx={{ height: '1px', width: '1px' }} />
            </Box>

            {/* Loading indicator */}
            {loading && (
                <Box display="flex" justifyContent="center" alignItems="center" p={2}>
                    <CircularProgress />
                </Box>
            )}
        </Box>
    );
};

export default SuggestedConnections;
