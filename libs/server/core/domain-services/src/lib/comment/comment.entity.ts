import { Column, Entity, PrimaryColumn, ManyToOne, OneToMany } from 'typeorm';
import { DbTableNames } from '../db-table-names';
import { Comment } from '@involvemint/shared/domain'
import { ActivityPostEntity } from '../activity-post/activity-post.entity';
import { UserEntity } from '../user/user.entity';
import { FlagEntity } from '../flag/flag.entity';


@Entity({ name: DbTableNames.Comment })
export class CommentEntity implements Required<Comment> {
    @PrimaryColumn('text')
    id!: string;

    @Column()
    text!: string;

    @ManyToOne(() => ActivityPostEntity, (e) => e.comments)
    activityPost!: ActivityPostEntity;

    @ManyToOne(() => UserEntity, (e) => e.comments)
    user!: UserEntity;

    @OneToMany(() => FlagEntity, (e) => e.comment)
    flags!: FlagEntity[];

    @Column()
    dateCreated!: Date;

    @Column()
    hidden!: boolean;

    @Column()
    flagCount!: number;

    @Column()
    handleId!: string;

    @Column()
    profilePicFilePath!: string;

    @Column()
    name!: string;
}
