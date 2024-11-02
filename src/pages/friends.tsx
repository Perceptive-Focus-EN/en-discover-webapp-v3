import React, { useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Button, TextField, MenuItem, Select, InputLabel, FormControl, IconButton, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface Friend {
    id: number;
    name: string;
    avatar: string;
    category: string;
}

const mockFriends: Friend[] = [
    { id: 1, name: 'John Doe', avatar: 'https://via.placeholder.com/150', category: 'Work' },
    { id: 2, name: 'Jane Smith', avatar: 'https://via.placeholder.com/150', category: 'Family' },
    { id: 3, name: 'Alice Johnson', avatar: 'https://via.placeholder.com/150', category: 'School' },
];

const FriendsPage: React.FC = () => {
    const [friends, setFriends] = useState<Friend[]>(mockFriends);
    const [newFriend, setNewFriend] = useState({ name: '', avatar: '', category: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [editFriendId, setEditFriendId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAddFriend = () => {
        if (!newFriend.name || !newFriend.category) {
            alert('Name and Category are required');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            if (editFriendId !== null) {
                setFriends(friends.map(friend => friend.id === editFriendId ? { ...newFriend, id: editFriendId } : friend));
                setEditFriendId(null);
            } else {
                setFriends([...friends, { ...newFriend, id: friends.length + 1 }]);
            }
            setNewFriend({ name: '', avatar: '', category: '' });
            setLoading(false);
        }, 1000);
    };

    const handleDeleteFriend = (id: number) => {
        setLoading(true);
        setTimeout(() => {
            setFriends(friends.filter(friend => friend.id !== id));
            setLoading(false);
        }, 1000);
    };

    const handleEditFriend = (friend: Friend) => {
        setNewFriend({ name: friend.name, avatar: friend.avatar, category: friend.category });
        setEditFriendId(friend.id);
    };

    const filteredFriends = friends.filter(friend => friend.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const defaultAvatar = 'https://via.placeholder.com/150';

    return (
        <Container>
            <Typography variant="h3" gutterBottom>Friends</Typography>
            <TextField
                label="Search Friends"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ marginBottom: '20px' }}
            />
            {loading ? (
                <CircularProgress />
            ) : (
                <Grid container spacing={3}>
                    {filteredFriends.map(friend => (
                        <Grid item xs={12} sm={6} md={4} key={friend.id}>
                            <Card>
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={friend.avatar || defaultAvatar}
                                    alt={friend.name}
                                />
                                <CardContent>
                                    <Typography variant="h5" component="div">{friend.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{friend.category}</Typography>
                                    <IconButton onClick={() => handleEditFriend(friend)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDeleteFriend(friend.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
            <Typography variant="h4" gutterBottom style={{ marginTop: '20px' }}>{editFriendId !== null ? 'Edit Friend' : 'Add New Friend'}</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Name"
                        fullWidth
                        value={newFriend.name}
                        onChange={(e) => setNewFriend({ ...newFriend, name: e.target.value })}
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Avatar URL"
                        fullWidth
                        value={newFriend.avatar}
                        onChange={(e) => setNewFriend({ ...newFriend, avatar: e.target.value })}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth required>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={newFriend.category}
                            onChange={(e) => setNewFriend({ ...newFriend, category: e.target.value })}
                        >
                            <MenuItem value="Work">Work</MenuItem>
                            <MenuItem value="Family">Family</MenuItem>
                            <MenuItem value="School">School</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <Button variant="contained" color="primary" onClick={handleAddFriend} disabled={loading}>
                        {editFriendId !== null ? 'Update Friend' : 'Add Friend'}
                    </Button>
                </Grid>
            </Grid>
        </Container>
    );
};

export default FriendsPage;