// // src/components/Feed/context/useReactionOperations.tsx
// import { postReactionsApi } from '@/lib/api/reactions/postReactions';
// import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
// import { EmotionId } from '../types/Reaction';
// import { useFeed } from './FeedContext';

// const useReactionOperations = () => {
//   const { state, updatePost } = useFeed();

//   const fetchReactions = async (postId: string): Promise<Reaction[]> => {
//     try {
//       const reactions = await postReactionsApi.fetch(postId);
//       return reactions;
//     } catch (error) {
//       messageHandler.error('Failed to fetch reactions');
//       throw error;
//     }
//   };

//   const updateReaction = async (postId: string, emotionId: EmotionId): Promise<void> => {
//     try {
//       const updatedReactions = await postReactionsApi.update(postId, emotionId);
//       const post = state.posts.find(p => p.id === postId);
//       if (post) {
//         await updatePost(postId, { ...post, reactions: updatedReactions });
//       }
//     } catch (error) {
//       messageHandler.error('Failed to update reaction');
//       throw error;
//     }
//   };

//   return {
//     fetchReactions,
//     updateReaction
//   };
// };

// export default useReactionOperations;