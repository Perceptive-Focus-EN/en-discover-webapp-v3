// src/components/RouteGuard.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Add exact route path matching
const publicPaths = [
    '/login',
    '/signup', // Make sure this matches your file path exactly
    '/forgot-password'
];

export const RouteGuard = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const authCheck = () => {
            if (loading) return;
            
            // Log for debugging
            console.log('Current path:', router.pathname);
            
            const isPublicPath = publicPaths.includes(router.pathname);
            console.log('Is public path?', isPublicPath);

            if (!user && !isPublicPath) {
                setAuthorized(false);
                router.push('/login');
            } else {
                setAuthorized(true);
            }
        };

        authCheck();

        const hideContent = () => setAuthorized(false);
        router.events.on('routeChangeStart', hideContent);
        router.events.on('routeChangeComplete', authCheck);

        return () => {
            router.events.off('routeChangeStart', hideContent);
            router.events.off('routeChangeComplete', authCheck);
        };
    }, [loading, user, router.pathname]); // Added router.pathname to dependencies

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return authorized ? <>{children}</> : null;
};