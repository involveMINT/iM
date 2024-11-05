import { Flag } from "@involvemint/shared/domain";
import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { DbTableNames } from "../db-table-names";
import { CommentEntity } from '../comment/comment.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ name: DbTableNames.Flag })
export class FlagEntity implements Required<Flag> {
    @PrimaryColumn('text')
    id!: string;

    @ManyToOne(() => CommentEntity, (e) => e.flags)
    comment!: CommentEntity;

    @ManyToOne(() => UserEntity, (e) => e.flags)
    user!: UserEntity;

    @Column()
    dateCreated!: Date;
}
