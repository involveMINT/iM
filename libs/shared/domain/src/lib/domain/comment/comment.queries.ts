import { createQuery } from '@orcha/common';
import { Comment } from './comment.model';

export const CommentQuery = createQuery<Comment>()({
  id: true,
  text: true,
  dateCreated: true,
  hidden: true,
  flagCount: true,
  user: {
    id: true,
  },
  flags: {
    id: true,
    user: {
      id: true
    },
  },
  handleId: true,
  profilePicFilePath: true,
  name: true
})