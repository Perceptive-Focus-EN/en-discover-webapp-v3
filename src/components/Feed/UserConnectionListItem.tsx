// UserConnectionListItem.tsx
import React from 'react';
import {
    Typography,
    Avatar,
    Button,
    useTheme,
} from '@mui/material';
import { MoreHorizontal, Plus } from 'lucide-react';

interface UserConnectionListItemProps {
    connection: {
        userId: string;
        name: string;
        email: string;
        avatar: string;
        age: number;
        tag: string;
        mood: string;
        isFriend: boolean;
    };
    onConnect: () => void;
    onMoreOptions: () => void;
    isMobile: boolean;
}

const UserConnectionListItem: React.FC<UserConnectionListItemProps> = ({
    connection,
    onConnect,
    onMoreOptions,
    isMobile,
}) => {
    const { name, email, avatar, age, tag, mood, isFriend } = connection;

    const theme = useTheme();

    return (
        <div
            style={{
                border: '1px solid',
                borderColor: theme.palette.divider,
                borderRadius: theme.shape.borderRadius,
                padding: theme.spacing(2),
                backgroundColor: theme.palette.background.paper,
                marginBottom: isMobile ? 0 : theme.spacing(2),
                marginRight: isMobile ? theme.spacing(2) : 0,
                flexShrink: 0,
                width: isMobile ? 250 : '100%',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={avatar} alt={name} style={{ width: 56, height: 56 }} />
                <div style={{ marginLeft: theme.spacing(2) }}>
                    <Typography variant="subtitle1">{name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                        {email}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {`Age: ${age}, Tag: ${tag}, Mood: ${mood}`}
                    </Typography>
                </div>
            </div>
            <div style={{ marginTop: theme.spacing(2), display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    startIcon={isFriend ? <MoreHorizontal size={16} /> : <Plus size={16} />}
                    onClick={isFriend ? onMoreOptions : onConnect}
                    color="primary"
                >
                    {isFriend ? 'Options' : 'Connect'}
                </Button>
            </div>
        </div>
    );
};

export default UserConnectionListItem;
