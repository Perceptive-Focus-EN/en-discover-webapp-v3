import React from 'react';
import { Box, Typography } from '@mui/material';
import QRCode from 'react-qr-code';
import { Nfc } from 'lucide-react';

interface QRCodeComponentProps {
    value: string;
    nfcId: string;
    size?: number;
    title?: string;  // New prop for dynamic title
}

const QRCodeComponent: React.FC<QRCodeComponentProps> = ({ 
    value, 
    nfcId, 
    size = 200,
    title = "QR Code"
}) => {
    return (
        <Box display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>
            <QRCode 
                value={value}
                size={size}
                level="H"
                style={{
                    height: "auto",
                    maxWidth: "100%",
                    width: "100%",
                }}
            />
            <Typography variant="body2" color="textSecondary" mt={2}>
                Scan for digital verification
            </Typography>
            <Box mt={2} display="flex" alignItems="center">
                <Nfc size={16} style={{ marginRight: '8px' }} />
                <Typography variant="body2" color="textSecondary">
                    NFC ID: {nfcId}
                </Typography>
            </Box>
        </Box>
    );
};

export default QRCodeComponent;