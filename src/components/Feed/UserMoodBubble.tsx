import React from 'react';
import { Box, Typography, Avatar, SvgIcon, useTheme } from '@mui/material';
import { User } from '../../types/User/interfaces';
import { useMoodBoard } from '../../contexts/MoodBoardContext';
import CheckIcon from '@mui/icons-material/Check';

interface UserMoodBubbleProps {
    user: User;
    isVerified?: boolean;
    isSubscribed?: boolean;
}

const UserMoodBubble: React.FC<UserMoodBubbleProps> = ({ user, isVerified = true, isSubscribed = true }) => {
    const theme = useTheme();
    const { emotions } = useMoodBoard();
    const currentMoodId = 1; // This should be dynamically set based on user's current mood
    const currentMood = emotions.find(emotion => emotion.id === currentMoodId);

    const isDarkMode = theme.palette.mode === 'dark';

    const borderStyle = {
        position: 'relative',
        width: 88,
        height: 88,
        borderRadius: '50%',
        padding: '4px',
        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        boxShadow: isDarkMode
            ? `0 0 10px ${theme.palette.primary.main}80, 0 0 15px ${theme.palette.secondary.main}80`
            : 'none',
        '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50%',
            border: '4px solid transparent',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}) border-box`,
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            maskComposite: 'exclude',
        },
    };

    const verificationBadgeStyle = {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: '#FFD700', // Gold color for the badge
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: `0 0 0 2px transparent`, // Make border color transparent
        zIndex: 2,
    };

    return (
        <Box display="flex" flexDirection="column" alignItems="center" className="animate-fade-in-up">
            <Box sx={isSubscribed ? borderStyle : { width: 80, height: 80 }}>
                <Avatar
                    src={user.avatarUrl}
                    sx={{
                        width: 80,
                        height: 80,
                        border: isSubscribed ? 'none' : `2px solid ${currentMood?.color || theme.palette.text.secondary}`,
                        zIndex: 1,
                        position: 'relative',
                    }}
                />
                {isVerified && (
                    <Box sx={verificationBadgeStyle}>
                        <SvgIcon component={CheckIcon} sx={{ color: '#000000', fontSize: 16 }} />
                    </Box>
                )}
            </Box>
            <Typography variant="h6" mt={2} color="text.primary">{`${user.firstName} ${user.lastName}`}</Typography>
            <Box
                sx={{
                    mt: 1,
                    p: 1,
                    borderRadius: 16,
                    backgroundColor: currentMood?.color || theme.palette.action.selected,
                }}
            >
                <Typography variant="body2" sx={{ color: theme.palette.getContrastText(currentMood?.color || theme.palette.action.selected) }}>
                    Feeling {currentMood?.emotionName || 'Unknown'}
                </Typography>
            </Box>
        </Box>
    );
};

export default UserMoodBubble;