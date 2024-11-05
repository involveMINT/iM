import { Poi } from '@involvemint/shared/domain';
import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { CreditEntity } from '../credit/credit.entity';
import { DbTableNames } from '../db-table-names';
import { EnrollmentEntity } from '../enrollment/enrollment.entity';
import { QuestionAnswerEntity } from '../question-answer/question-answer.entity';
import { TaskEntity } from '../task/task.entity';
import { ActivityPostEntity } from '../activity-post/activity-post.entity';

@Entity({ name: DbTableNames.Poi })
export class PoiEntity implements Required<Poi> {
  @PrimaryColumn('text')
  id!: string;

  @Column({ default: 'NOW()' })
  dateCreated!: Date;

  @Column({ nullable: true })
  dateStarted!: Date;

  @Column({ nullable: true })
  dateStopped!: Date;

  @Column({ nullable: true })
  dateSubmitted!: Date;

  @Column({ nullable: true })
  dateApproved!: Date;

  @Column({ nullable: true })
  dateDenied!: Date;

  @Column('text', { array: true, nullable: true, default: '{}' })
  imagesFilePaths!: string[];

  @Column('text', { array: true, nullable: true })
  pausedTimes!: string[];

  @Column('text', { array: true, nullable: true })
  resumedTimes!: string[];

  @Column('float8', { nullable: true })
  longitude!: number;

  @Column('float8', { nullable: true })
  latitude!: number;

  @ManyToOne(() => EnrollmentEntity, (p) => p.pois)
  enrollment!: EnrollmentEntity;

  @OneToMany(() => QuestionAnswerEntity, (qa) => qa.poi)
  answers!: QuestionAnswerEntity[];

  @OneToMany(() => CreditEntity, (e) => e.poi)
  credits!: CreditEntity[];

  @OneToOne(() => TaskEntity, (e) => e.poi, { nullable: true })
  task!: TaskEntity;

  @OneToOne(() => ActivityPostEntity, (e) => e.poi, { nullable: true })
  activityPost!: ActivityPostEntity;
}
