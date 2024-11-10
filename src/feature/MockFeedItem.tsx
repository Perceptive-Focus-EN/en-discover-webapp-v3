// import React, { useState } from 'react';
// import { Box, Typography, Avatar, IconButton } from '@mui/material';
// import MoreVertIcon from '@mui/icons-material/MoreVert';
// import MoodBubbleLikeButton from './MoodBubbleLikeButton';
// import { EmotionId } from './types/Reaction';

// const initialReactions = [
//     { emotionId: 1, count: 1 },
// ];

// const MockFeedItem: React.FC = () => {
//     const [reactions, setReactions] = useState(initialReactions);

//     const handleReactionSelect = (emotionId: EmotionId) => {
//         setReactions(prevReactions => {
//             const existingReaction = prevReactions.find(r => r.emotionId === emotionId);
//             if (existingReaction) {
//                 return prevReactions.map(r =>
//                     r.emotionId === emotionId ? { ...r, count: r.count + 1 } : r
//                 );
//             } else {
//                 return [...prevReactions, { emotionId, count: 1 }];
//             }
//         });
//     };

//     return (
//         <Box sx={{
//             border: '1px solid #ccc',
//             borderRadius: 2,
//             p: 2,
//             pb: 8, // Add bottom padding here
//             mb: 2,
//             maxWidth: 600,
//             mx: 'auto',
//             bgcolor: 'background.paper',
//             boxShadow: 1,
//         }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                 <Avatar sx={{ mr: 1, width: 32, height: 32 }}>U</Avatar>
//                 <Box sx={{ flexGrow: 1 }}>
//                     <Typography variant="subtitle2" fontWeight="bold">User Name</Typography>
//                     <Typography variant="caption" color="text.secondary">2h ago</Typography>
//                 </Box>
//                 <IconButton size="small">
//                     <MoreVertIcon fontSize="small" />
//                 </IconButton>
//             </Box>
//             <Typography variant="body2" sx={{ mb: 1 }}>
//                 This is a mock feed item. Interact with the reaction button below.
//             </Typography>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                 <MoodBubbleLikeButton
//                     postId="mock-post-1"
//                     reactions={reactions}
//                     onReactionSelect={handleReactionSelect}
//                 />
//                 <Typography variant="caption" color="text.secondary">
//                     {reactions.reduce((sum, r) => sum + r.count, 0)} reactions
//                 </Typography>
//             </Box>
//         </Box>
//     );
// };

// export default MockFeedItem;