import { IManyToOne } from '@orcha/common';
import { Comment } from '../comment';
import { User } from '../user';


export interface Flag {
  id: string;

  comment: IManyToOne<Comment, 'flags'>;
  user: IManyToOne<User, 'flags'>;

  dateCreated: Date | string;
}
