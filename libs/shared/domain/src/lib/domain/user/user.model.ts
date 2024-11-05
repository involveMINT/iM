import { IOneToMany, IOneToOne, IManyToOne } from '@orcha/common';
import { ChangeMaker } from '../change-maker';
import { EpApplication } from '../ep-application';
import { ExchangeAdmin } from '../exchange-admin';
import { ServeAdmin } from '../serve-admin';
import { SpApplication } from '../sp-application';
import { ActivityPost } from '../activity-post';
import { Like } from '../like';
import { Comment } from '../comment';
import { Flag } from '../flag';

export interface User {
  /** `id` is the user's email address. */
  id: string;
  passwordHash: string;
  salt: string;
  dateCreated: Date | string;
  dateLastLoggedIn?: Date | string;
  active: boolean;
  activationHash?: string;
  forgotPasswordHash?: string;
  joyride: boolean;
  baAdmin: boolean;

  changeMaker?: IOneToOne<ChangeMaker, 'user'>;
  serveAdmins: IOneToMany<ServeAdmin, 'user'>;
  exchangeAdmins: IOneToMany<ExchangeAdmin, 'user'>;
  epApplications: IOneToMany<EpApplication, 'user'>;
  spApplications: IOneToMany<SpApplication, 'user'>;

  activityPosts: IOneToMany<ActivityPost, 'user'>;
  likes: IOneToMany<Like, 'user'>;
  comments: IOneToMany<Comment, 'user'>;
  flags: IOneToMany<Flag, 'user'>;

  updatedAt: Date | string;
}

export type ISnoopData = User & { token: string };
