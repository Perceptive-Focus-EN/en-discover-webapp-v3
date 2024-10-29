// src/features/posts/components/Comments/CommentList.tsx
import React from 'react';
import { useComments } from '../hooks/useComments';
import { Comment as CommentType } from '../api/commentApi';
import { useInView } from 'react-intersection-observer';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';

interface CommentListProps {
  postId: string;
}

export const CommentList: React.FC<CommentListProps> = ({ postId }) => {
  const { 
    comments,
    loading,
    error,
    hasMore,
    addComment,
    updateComment,
    deleteComment,
    loadMore
  } = useComments(postId);

  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false
  });

  React.useEffect(() => {
    if (inView && hasMore) {
      loadMore();
    }
  }, [inView, hasMore, loadMore]);

  return (
    <div className="space-y-4">
      <CommentForm onSubmit={addComment} />
      
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onUpdate={updateComment}
          onDelete={deleteComment}
          onReply={addComment}
        />
      ))}

      {loading && <div>Loading comments...</div>}
      {error && <div className="text-red-500">{error}</div>}
      
      <div ref={ref} className="h-10" />
    </div>
  );
};
