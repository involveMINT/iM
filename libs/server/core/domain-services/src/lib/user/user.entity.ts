import { User } from '@involvemint/shared/domain';
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ChangeMakerEntity } from '../change-maker/change-maker.entity';
import { DbTableNames } from '../db-table-names';
import { EpApplicationEntity } from '../ep-application/ep-application.entity';
import { ExchangeAdminEntity } from '../exchange-admin/exchange-admin.entity';
import { ServeAdminEntity } from '../serve-admin/serve-admin.entity';
import { SpApplicationEntity } from '../sp-application/sp-application.entity';
import { ActivityPostEntity } from '../activity-post/activity-post.entity';
import { LikeEntity } from '../like/like.entity';
import { FlagEntity } from '../flag/flag.entity';
import { CommentEntity } from '../comment/comment.entity';

@Entity({ name: DbTableNames.User })
export class UserEntity implements Required<User> {
  @PrimaryColumn('text')
  id!: string;

  @Column()
  passwordHash!: string;

  @Column()
  salt!: string;

  @Column({ default: 'NOW()' })
  dateCreated!: Date;

  @Column({ nullable: true })
  dateLastLoggedIn!: Date;

  @Column({ default: false })
  active!: boolean;

  @Column({ nullable: true })
  activationHash!: string;

  @Column({ nullable: true })
  forgotPasswordHash!: string;

  @Column({ default: true })
  joyride!: boolean;

  @Column({ default: false })
  baAdmin!: boolean;

  @OneToOne(() => ChangeMakerEntity, (e) => e.user, { nullable: true })
  @JoinColumn()
  changeMaker!: ChangeMakerEntity;

  @OneToMany(() => ServeAdminEntity, (e) => e.user)
  serveAdmins!: ServeAdminEntity[];

  @OneToMany(() => ExchangeAdminEntity, (e) => e.user)
  exchangeAdmins!: ExchangeAdminEntity[];

  @OneToMany(() => EpApplicationEntity, (e) => e.user)
  epApplications!: EpApplicationEntity[];

  @OneToMany(() => SpApplicationEntity, (e) => e.user)
  spApplications!: SpApplicationEntity[];

  @OneToMany(() => ActivityPostEntity, (e) => e.user)
  activityPosts!: ActivityPostEntity[];

  @OneToMany(() => LikeEntity, (e) => e.user)
  likes!: LikeEntity[];

  @OneToMany(() => FlagEntity, (e) => e.user)
  flags!: FlagEntity[];

  @OneToMany(() => CommentEntity, (e) => e.user)
  comments!: CommentEntity[];

  @UpdateDateColumn()
  updatedAt!: Date;
}
