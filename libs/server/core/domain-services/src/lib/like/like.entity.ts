import { Like } from "@involvemint/shared/domain";
import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { DbTableNames } from "../db-table-names";
import { ActivityPostEntity } from '../activity-post/activity-post.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ name: DbTableNames.Like })
export class LikeEntity implements Required<Like> {
    @PrimaryColumn('text')
    id!: string;

    @ManyToOne(() => ActivityPostEntity, (e) => e.likes)
    activityPost!: ActivityPostEntity;

    @ManyToOne(() => UserEntity, (e) => e.likes)
    user!: UserEntity;

    @Column()
    dateCreated!: Date;
}
