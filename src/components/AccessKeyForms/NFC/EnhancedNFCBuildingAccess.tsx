import React, { useState, useEffect } from 'react';
import { 
    TextField, Button, Typography, CircularProgress, Snackbar, Alert,
    SnackbarCloseReason
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../lib/axiosSetup';
import AccessHistory from './AccessHistory'; // Import the new AccessHistory component

interface AccessAttempt {
    timestamp: string;
    nfcId: string;
    name: string;
    accessGranted: boolean;
}

interface UserData {
    name: string;
    role: string;
    department: string;
}

const EnhancedNFCBuildingAccess: React.FC = () => {
    const { user } = useAuth();
    const [nfcId, setNfcId] = useState('');
    const [accessStatus, setAccessStatus] = useState<'Granted' | 'Denied' | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [accessHistory, setAccessHistory] = useState<AccessAttempt[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'error' | 'warning' | 'info'}>({
        open: false,
        message: '',
        severity: 'info'
    });

    const handleNfcScan = async () => {
        setLoading(true);
        setError(null);
        setAccessStatus(null);
        setUserData(null);

        try {
            const response = await axiosInstance.post(`/api/tenant/${user?.currentTenantId}/nfc-access`, { nfcId });
            const { accessGranted, userData } = response.data;
            setAccessStatus(accessGranted ? 'Granted' : 'Denied');

            if (accessGranted && userData) {
                setUserData({
                    name: userData.name,
                    role: userData.role || 'N/A',
                    department: userData.department || 'N/A',
                });
                setSnackbar({ open: true, message: 'Access Granted', severity: 'info' });
            } else {
                setSnackbar({ open: true, message: 'Access Denied', severity: 'warning' });
            }

            setAccessHistory(prev => [
                {
                    timestamp: new Date().toISOString(),
                    nfcId,
                    name: userData ? userData.name : 'Unknown',
                    accessGranted
                },
                ...prev.slice(0, 9)
            ]);
        } catch (error) {
            setError('Failed to check NFC access. Please try again.');
            setSnackbar({ open: true, message: 'Access Denied', severity: 'error' });
        } finally {
            setLoading(false);
            setNfcId('');
        }
    };

    const handleCloseSnackbar = (event: Event | React.SyntheticEvent<any, Event>, reason?: SnackbarCloseReason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                NFC Building Access for {user?.currentTenantId}
            </Typography>
            {/* NFC Scan Section */}
            <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}>
                Scan NFC
            </Typography>
            <TextField
                value={nfcId}
                onChange={(e) => setNfcId(e.target.value)}
                label="Scan NFC or Enter NFC ID"
                fullWidth
                margin="normal"
                variant="outlined"
                disabled={loading}
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            />
            <Button 
                onClick={handleNfcScan} 
                variant="contained" 
                color="primary" 
                fullWidth 
                sx={{ mt: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} /> : 'Simulate NFC Scan'}
            </Button>
            {error && (
                <Typography color="error" sx={{ mt: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {error}
                </Typography>
            )}
            {accessStatus && (
                <Typography
                    variant="h6"
                    color={accessStatus === 'Granted' ? 'green' : 'red'} 
                    sx={{ mt: 2, fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                    Access {accessStatus}
                </Typography>
            )}
            {userData && (
                <>
                    <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>User Information:</Typography>
                    <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Name: {userData.name}</Typography>
                    <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Role: {userData.role}</Typography>
                    <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Department: {userData.department}</Typography>
                </>
            )}

            {/* Access History Section */}
            <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}>
                Access History
            </Typography>
            {/* Pass accessHistory as prop to AccessHistory component */}
            <AccessHistory accessHistory={accessHistory} />

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default EnhancedNFCBuildingAccess;
