// // src/contexts/MockMoodBoardContext.tsx
// import React, { useState, useCallback } from 'react';
// import { MoodBoardContext } from './MoodBoardContext';
// import { Emotion } from '../components/EN/types/emotions';
// import { EmotionId, Reaction } from '@/components/Feed/types/Reaction';
// import { PostData, PostType } from '@/components/Feed/types/Post';

// const mockEmotions: Emotion[] = [
//     {
//         id: 1, emotionName: 'ENERGY', color: '#FFD700',
//         userId: '',
//         sources: []
//     },
//     {
//         id: 2, emotionName: 'SORROW', color: '#4169E1',
//         userId: '',
//         sources: []
//     },
//     {
//         id: 3, emotionName: 'REACTIVE', color: '#FF4500',
//         userId: '',
//         sources: []
//     },
//     {
//         id: 4, emotionName: 'DISGUST', color: '#228B22',
//         userId: '',
//         sources: []
//     },
//     {
//         id: 5, emotionName: 'TRANQUIL', color: '#FF1493',
//         userId: '',
//         sources: []
//     },
//     {
//         id: 6, emotionName: 'EUPHORIC', color: '#A52A2A',
//         userId: '',
//         sources: []
//     },
//     {
//         id: 7, emotionName: 'SUSPENSE', color: '#808080',
//         userId: '',
//         sources: []
//     },
//     {
//         id: 8, emotionName: 'FEAR', color: '#8A2BE2',
//         userId: '',
//         sources: []
//     },
// ];

// export const MockMoodBoardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [emotions, setEmotions] = useState<Emotion[]>(mockEmotions);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [moodHistory, setMoodHistory] = useState<any[]>([]);

//   const getEmotionMappings = useCallback(async (userId: string) => {
//     setIsLoading(true);
//     setError(null);
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     if (Math.random() < 0.1) {
//       setError('Failed to fetch emotion mappings');
//       setIsLoading(false);
//       return [];
//     }
//     setIsLoading(false);
//     return emotions;
//   }, [emotions]);

//   const updateEmotionColor = useCallback((emotionId: number, newColor: string) => {
//     setEmotions(prevEmotions => 
//       prevEmotions.map(emotion => 
//         emotion.id === emotionId ? { ...emotion, color: newColor } : emotion
//       )
//     );
//   }, []);

//   const fetchMoodData = useCallback(async () => {
//     setIsLoading(true);
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     setIsLoading(false);
//     return moodHistory;
//   }, [moodHistory]);

//   const saveMoodEntry = useCallback(async (entry: any) => {
//     setMoodHistory(prev => [...prev, entry]);
//   }, []);

//   const saveEmotionMappings = useCallback(async (mappings: any) => {
//     setEmotions(mappings);
//   }, []);

//   const updateEmotionMapping = useCallback(async (userId: string, emotion: Emotion) => {
//     setEmotions(prev => prev.map(e => e.id === emotion.id ? emotion : e));
//   }, []);

//   const mockReactions: { [key: string]: { id: string; emotionId: number; count: number; color: string; name: string; }[] } = {
//       'mock-post-1': [
//         { id: '1', emotionId: 1, count: 5, color: '#FFD700', name: 'ENERGY' },
//         { id: '2', emotionId: 3, count: 3, color: '#FF4500', name: 'REACTIVE' },
//         { id: '3', emotionId: 5, count: 2, color: '#FF1493', name: 'TRANQUIL' },
//       ],
//       'mock-post-2': [
//         { id: '4', emotionId: 2, count: 4, color: '#4169E1', name: 'SORROW' },
//         { id: '5', emotionId: 4, count: 1, color: '#228B22', name: 'DISGUST' },
//         { id: '6', emotionId: 6, count: 3, color: '#A52A2A', name: 'EUPHORIC' },
//       ],
//     };

//   const fetchPostReactions = useCallback(async (postId: string) => {
//     setIsLoading(true);
//     await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
//     setIsLoading(false);
//     return mockReactions[postId] || [];
//   }, []);

//   const updatePostReaction = useCallback(async (postId: string, emotionId: EmotionId) => {
//     setIsLoading(true);
//     await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
//     setIsLoading(false);
    
//     const updatedReactions = mockReactions[postId] ? [...mockReactions[postId]] : [];
//     const existingReaction = updatedReactions.find(r => r.emotionId === emotionId) as Reaction | undefined;
    
//     if (existingReaction) {
//       existingReaction.count += 1;
//     } else {
//       updatedReactions.push({
//           emotionId, count: 1,
//           id: '0',
//           color: '#000000', // default color
//           name: 'UNKNOWN' // default name
//       });
//     }
    
//     mockReactions[postId] = updatedReactions;
//     return updatedReactions;
//   }, []);

//   const fetchPostWithReactions = useCallback(async (postId: string) => {
//     const reactions = await fetchPostReactions(postId);
//     return {
//       id: postId,
//       reactions,
//       postType: 'mockType' as PostType, // Add appropriate mock data
//       content: { 
//         text: 'mockContent', 
//         backgroundColor: '#ffffff', 
//         textColor: '#000000', 
//         fontSize: 'medium', 
//         alignment: 'left', 
//         fontFamily: 'Arial', 
//         fontWeight: 'normal',
//         padding: '10px', // Add appropriate mock data
//         maxLines: 3 // Add appropriate mock data
//       }, // Ensure this matches the PostContent type
//       userId: 'mockUserId', // Add appropriate mock data
//       username: 'mockUsername', // Add appropriate mock data
//       timestamp: new Date().toISOString(), // Add appropriate mock data
//       likes: 0, // Add appropriate mock data
//       comments: [], // Add appropriate mock data
//       shares: 0, // Add appropriate mock data
//       views: 0, // Add appropriate mock data
//       firstName: 'mockFirstName', // Add appropriate mock data
//       lastName: 'mockLastName', // Add appropriate mock data
//       type: 'mockType', // Add appropriate mock data
//       tenantId: 'mockTenantId', // Add appropriate mock data
//       reactionCounts: {} // Add appropriate mock data
//     } as PostData;
//   }, [fetchPostReactions]);

//   const mockContextValue = {
//     emotions,
//     getEmotionMappings,
//     updateEmotionColor,
//     isLoading,
//     error,
//     moodHistory,
//     fetchMoodData,
//     getStartDate: () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
//     saveMoodEntry,
//     saveEmotionMappings,
//     updateEmotionMapping,
//     fetchPostReactions,
//     updatePostReaction,
//     fetchPostWithReactions,
//   };

//   return (
//     <MoodBoardContext.Provider value={mockContextValue}>
//       {children}
//     </MoodBoardContext.Provider>
//   );
// };