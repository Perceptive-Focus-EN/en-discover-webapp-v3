import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Avatar, Divider, IconButton } from '@mui/material';
import { styled, useTheme, Theme } from '@mui/material/styles';
import { Fingerprint, RotateCw, Nfc } from 'lucide-react';
import Barcode from 'react-barcode';
import { useSpring, animated } from '@react-spring/web';
import QRCodeComponent from './QRCodeComponent';

interface SecurityBadgeProps {
    name: string;
    role: string;
    accessLevel: string;
    accountType: string;
    avatarUrl?: string;
    userId: string;
    tenantId: string;
    accessKey: string;
    nfcId: string;
    isPreview?: boolean;
}

const StyledCard = styled(Card)(({ theme }) => ({
    maxWidth: 360,
    margin: 'auto',
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.shadows[3],
    perspective: '1000px',
    position: 'relative',
    height: 500,
    backgroundColor: 'transparent', // Set background color to transparent
}));

const FlipCardInner = styled(animated.div)(({ theme }) => ({
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
}));

const FlipCardFace = styled(Box)(({ theme }) => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: theme.shape.borderRadius * 2,
    overflow: 'hidden',
    padding: theme.spacing(3),
}));

const BarcodeContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
}));

function formatText(text: string): string {
    return text
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const FlipCardBack = styled(FlipCardFace)(({ theme }) => ({
    transform: 'rotateY(180deg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
}));

const SecurityBadge: React.FC<SecurityBadgeProps> = ({
    name = 'John Doe',
    role = 'Developer',
    accessLevel = 'L1',
    accountType = 'Admin',
    avatarUrl,
    userId = '123456',
    tenantId = 'tenant123',
    accessKey = 'ABC123456',
    nfcId = 'NFC123456',
    isPreview = false,
}) => {
    const theme: Theme = useTheme();
    const [isFlipped, setIsFlipped] = useState(false);

    const { transform, opacity } = useSpring({
        opacity: isFlipped ? 1 : 0,
        transform: `perspective(600px) rotateY(${isFlipped ? 180 : 0}deg)`,
        config: { mass: 5, tension: 500, friction: 80 },
    });

    const getAccessLevelColor = (level: string) => {
        switch (level) {
            case 'L1':
                return theme.palette.success.main;
            case 'L2':
                return theme.palette.info.main;
            case 'L3':
                return theme.palette.warning.main;
            case 'L4':
                return theme.palette.error.main;
            default:
                return theme.palette.text.primary;
        }
    };

    const handleFlip = () => {
        if (!isPreview) {
            setIsFlipped(!isFlipped);
        }
    };

    const previewAccessKey = 'PREVIEW1234567890';
    const previewNfcId = 'NFC-PREVIEW123';

    return (
        <StyledCard onClick={handleFlip}>
            <FlipCardInner style={{ transform }}>
                <FlipCardFace style={{ opacity: opacity.to(o => 1 - o) as any, transform: transform as any }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" mb={3}>
                            <Avatar src={avatarUrl} alt={name} sx={{ width: 56, height: 56, mr: 2 }}>
                                {!avatarUrl && <Fingerprint />}
                            </Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">{isPreview ? 'Your Name' : formatText(name)}</Typography>
                                <Typography variant="body1" color="textSecondary">
                                    {isPreview ? 'Your Role' : formatText(role)}
                                </Typography>
                            </Box>
                        </Box>
                        <Divider />
                        <Box mt={3}>
                            <Typography variant="body1" color="textSecondary" mb={1}>
                                Access Level: <span style={{ color: getAccessLevelColor(accessLevel), fontWeight: 'bold' }}>{accessLevel}</span>
                            </Typography>
                            <Typography variant="body1" color="textSecondary" mb={1}>
                                Account Type: {formatText(accountType)}
                            </Typography>
                            <Typography variant="body1" color="textSecondary" mb={1}>
                                User ID: {isPreview ? 'Your User ID' : userId}
                            </Typography>
                            <Typography variant="body1" color="textSecondary" mb={1}>
                                Tenant ID: {isPreview ? 'Your Tenant ID' : tenantId}
                            </Typography>
                            <Typography variant="body1" color="textSecondary" mb={1} display="flex" alignItems="center">
                                <Nfc size={16} style={{ marginRight: '8px' }} />
                                NFC ID: {isPreview ? previewNfcId : nfcId}
                            </Typography>
                        </Box>
                    </CardContent>
                    <Divider sx={{ mt: 2 }} />
                    <BarcodeContainer>
                        <Barcode
                            value={isPreview ? previewAccessKey : accessKey}
                            format="CODE128"
                            width={2}
                            height={60}
                            displayValue={true}
                            background="transparent"
                            lineColor={theme.palette.text.primary}
                        />
                    </BarcodeContainer>
                </FlipCardFace>
                <FlipCardBack style={{ opacity: opacity as any, transform: transform.to(t => `${t} rotateY(180deg)`) as any }}>
                    <QRCodeComponent 
                        value={isPreview ? previewAccessKey : accessKey}
                        nfcId={isPreview ? previewNfcId : nfcId}
                        size={200}
                    />
                </FlipCardBack>
            </FlipCardInner>
            {!isPreview && (
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        handleFlip();
                    }}
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1,
                    }}
                >
                    <RotateCw />
                </IconButton>
            )}
        </StyledCard>
    );
};

export default SecurityBadge;