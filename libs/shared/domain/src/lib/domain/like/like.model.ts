import { IManyToOne } from '@orcha/common';
import { ActivityPost } from '../activity-post';
import { User } from '../user';


export interface Like {
  id: string;

  activityPost: IManyToOne<ActivityPost, 'likes'>;
  user: IManyToOne<User, 'likes'>;

  dateCreated: Date | string;
}
