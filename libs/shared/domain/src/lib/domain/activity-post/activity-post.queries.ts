import { createQuery } from '@orcha/common';
import { CommentQuery } from '../comment';
import { PoiCmQuery } from '../poi';
import { ActivityPostUserQuery } from '../user';
import { ActivityPost } from './activity-post.model';


/**
 * Activity Post Query.
 * 
 * Queries are consumed by orchestration calls and they are used to tell
 * services which fields for an entity should be returned ('true' value on
 * the field).
 * 
 * Ex:
 * ActivityPostQuery => Generic query for an ActivityPost which returns a
 *                      subset of the fields in an ActivityPost.
 */
export const ActivityPostQuery = createQuery<ActivityPost>()({
  id: true,
  likeCount: true,
  dateCreated: true,
  enabled: true,
  poi: {
    ...PoiCmQuery
  },
  user: {
    ...ActivityPostUserQuery
  },
  comments: {
    ...CommentQuery
  },
  likes: {
    id: true,
    user: {
      id: true
    },
    dateCreated: true
  }
});

export const ActivityFeedQuery = createQuery<ActivityPost[]>()({
  ...ActivityPostQuery,
  __paginate: {
    limit: 10,
    page: 1,
  }
});
