import { IManyToOne, IOneToMany } from '@orcha/common';
import { User } from '../user';
import { ActivityPost } from '../activity-post'
import { Flag } from '../flag';


export interface Comment {
  id: string;
  text: string;
  flagCount: number;

  activityPost: IManyToOne<ActivityPost, 'comments'>;
  user: IManyToOne<User, 'comments'>;
  flags: IOneToMany<Flag, 'comment'>;

  dateCreated: Date | string;
  hidden: boolean;

  handleId: string;
  profilePicFilePath: string;
  name: string;
}

export interface Comments {
  id: string;
  comments: Comment[];
}

export interface FormattedComments {
  id: string;
  comments: Comment[];
}
