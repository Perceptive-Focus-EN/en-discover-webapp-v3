// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Box, Container, Typography, IconButton, Grid, Button } from '@mui/material';
// import CloseIcon from '@mui/icons-material/Close';
// import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import PersistentBottomSheet from './PersistentBottomSheet';
// import VolumeToggle from './VolumeToggle';
// import RelationshipTags from './RelationshipTags';
// import CheckBoxComponent from './CheckBoxComponent';

// const MoodSelectionPage: React.FC = () => {
//   const { mood } = useParams<{ mood: string }>();
//   const navigate = useNavigate();
//   const [selectedVolume, setSelectedVolume] = useState<string>('');
//   const [selectedTags, setSelectedTags] = useState<string[]>([]);
//   const [shareWithFriends, setShareWithFriends] = useState<boolean>(false);

//   useEffect(() => {
//     if (mood) {
//       console.log(`Mood selected: ${mood}`);
//     }
//   }, [mood]);

//   const handleVolumeSelect = (volume: string) => {
//     setSelectedVolume(volume);
//   };

//   const handleTagSelect = (tag: string) => {
//     setSelectedTags(prev =>
//       prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
//     );
//   };

//   return (
//     <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
//       {/* Header Section */}
//       <Box sx={{ backgroundColor: '#FF7043', color: '#fff', py: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <IconButton onClick={() => navigate(-1)} sx={{ color: '#fff' }}>
//           <ArrowBackIcon />
//         </IconButton>
//         <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
//           Pick {mood} for today
//         </Typography>
//         <IconButton onClick={() => navigate('/')} sx={{ color: '#fff' }}>
//           <CloseIcon />
//         </IconButton>
//       </Box>

//       {/* Main Content */}
//       <Container sx={{ flexGrow: 1, py: 4 }}>
//         <Typography variant="h5" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
//           What is your {mood} volume?
//         </Typography>
//         <Typography variant="body2" sx={{ textAlign: 'center', mb: 4 }}>
//           Select volume and cause of feelings for {mood}
//         </Typography>

//         {/* Volume Toggle Section */}
//         <VolumeToggle
//           selectedVolume={selectedVolume}
//           onSelectVolume={handleVolumeSelect}
//         />

//         {/* Relationship Tags Section */}
//         <Typography variant="h6" sx={{ mt: 4, mb: 2, textAlign: 'center' }}>
//           Select tags related to your mood
//         </Typography>
//         <RelationshipTags
//           selectedTags={selectedTags}
//           onSelectTag={handleTagSelect}
//         />

//         {/* Share with Friends Section */}
//         <CheckBoxComponent
//           checked={shareWithFriends}
//           onChange={() => setShareWithFriends(!shareWithFriends)}
//           label="Share with friends into feed"
//         />

//         {/* Submit Button */}
//         <Button
//           variant="contained"
//           fullWidth
//           sx={{ mt: 4, py: 2, backgroundColor: '#FF7043', color: '#fff', fontWeight: 'bold' }}
//           onClick={() => console.log(`Submitted mood: ${mood}, volume: ${selectedVolume}, tags: ${selectedTags}`)}
//         >
//           That is my {mood} for now
//         </Button>
//       </Container>

//       {/* Persistent Bottom Sheet */}
//       <PersistentBottomSheet>
//         <Typography variant="h6" sx={{ textAlign: 'center', color: '#ffffff', fontWeight: 'bold' }}>
//           How much? Why so?
//         </Typography>
//       </PersistentBottomSheet>
//     </Box>
//   );
// };

// export default MoodSelectionPage;
