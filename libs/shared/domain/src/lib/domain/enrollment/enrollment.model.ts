import { IManyToMany, IManyToOne, IOneToMany } from '@orcha/common';
import { ChangeMaker } from '../change-maker';
import { EnrollmentDocument } from '../enrollment-document';
import { Poi } from '../poi';
import { Project } from '../project';

export interface Enrollment {
  id: string;
  dateApplied: Date | string;
  dateSubmitted?: Date | string;
  dateApproved?: Date | string;
  dateDenied?: Date | string;
  dateRetired?: Date | string;
  acceptedWaiver: boolean;

  changeMaker: IManyToOne<ChangeMaker, 'enrollments'>;
  project: IManyToOne<Project, 'enrollments'>;
  pois: IManyToMany<Poi, 'enrollments'>;
  enrollmentDocuments: IOneToMany<EnrollmentDocument, 'enrollment'>;
}
