import { Injectable } from '@angular/core';
import { ProjectFeedStoreModel } from '@involvemint/client/shared/data-access';
import { LatLng } from '@involvemint/client/shared/util';
import {
  LinkPassportDocumentDto,
  QuestionAnswersDto,
  SubmitEnrollmentApplicationDto,
} from '@involvemint/shared/domain';
import { Actions, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { take, tap } from 'rxjs/operators';
import * as EnrollmentActions from './enrollments/enrollments.actions';
import { EnrollmentStoreModel } from './enrollments/enrollments.reducer';
import * as EnrollmentSelectors from './enrollments/enrollments.selectors';
import * as PassportActions from './passport/passport.actions';
import { PassportDocumentStoreModel } from './passport/passport.reducer';
import * as PassportSelectors from './passport/passport.selectors';
import * as PoiActions from './pois/pois.actions';
import { PoiCmStoreModel } from './pois/pois.reducer';
import * as PoiSelectors from './pois/pois.selectors';

@Injectable()
export class ChangeMakerFacade {
  readonly enrollments = {
    dispatchers: {
      startApplication: (project: ProjectFeedStoreModel) => {
        this.store.dispatch(EnrollmentActions.startApplication({ project }));
      },
      withdrawEnrollment: (enrollment: EnrollmentStoreModel) => {
        this.store.dispatch(EnrollmentActions.withdrawEnrollment({ enrollment }));
      },
      refresh: () => {
        this.store.dispatch(EnrollmentActions.refreshEnrollments());
      },
      linkPassportDocument: (dto: LinkPassportDocumentDto) => {
        this.store.dispatch(EnrollmentActions.linkPassportDocument({ dto }));
      },
      submitApplication: (dto: SubmitEnrollmentApplicationDto) => {
        this.store.dispatch(EnrollmentActions.submitApplication({ dto }));
      },
      acceptWaiver: (enrollment: EnrollmentStoreModel) => {
        this.store.dispatch(EnrollmentActions.acceptWaiver({ enrollment }));
      },
    },
    selectors: {
      enrollments$: this.store.pipe(select(EnrollmentSelectors.getEnrollments)).pipe(
        tap(({ loaded }) => {
          if (!loaded) {
            this.store.dispatch(EnrollmentActions.loadEnrollments());
          }
        })
      ),
      getEnrollment: (enrollmentId: string) =>
        this.store.pipe(select(EnrollmentSelectors.getEnrollment(enrollmentId))).pipe(
          tap(({ loaded }) => {
            if (!loaded) {
              this.store.dispatch(EnrollmentActions.loadEnrollments());
            }
          })
        ),
    },
  };

  readonly passport = {
    actionListeners: {
      createPassportDocument: {
        success: this.actions$.pipe(ofType(PassportActions.createPassportDocumentSuccess)),
        error: this.actions$.pipe(ofType(PassportActions.createPassportDocumentError)),
      },
    },
    dispatchers: {
      refresh: () => {
        this.store.dispatch(PassportActions.refreshPassport());
      },
      createPassportDocument: (file: File) => {
        this.store.dispatch(PassportActions.createPassportDocument({ file }));
      },
      editPassportDocument: (document: PassportDocumentStoreModel, newName: string) => {
        this.store.dispatch(PassportActions.editPassportDocument({ document, newName }));
      },
      replacePassportDocument: (document: PassportDocumentStoreModel, file: File) => {
        this.store.dispatch(PassportActions.replacePassportDocument({ document, file }));
      },
      deletePassportDocument: (document: PassportDocumentStoreModel) => {
        this.store.dispatch(PassportActions.deletePassportDocument({ document }));
      },
    },
    selectors: {
      passport$: this.store.pipe(select(PassportSelectors.getDocuments)).pipe(
        tap(({ loaded }) => {
          if (!loaded) {
            this.store.dispatch(PassportActions.loadPassport());
          }
        })
      ),
      getPassportDocument: (documentId: string) =>
        this.store.pipe(select(PassportSelectors.getDocument(documentId))).pipe(
          tap(({ loaded }) => {
            if (!loaded) {
              this.store.dispatch(PassportActions.loadPassport());
            }
          })
        ),
    },
  };

  readonly poi = {
    dispatchers: {
      refresh: () => {
        this.store.dispatch(PoiActions.refreshPois());
      },
      loadMore: () => {
        this.store.pipe(select(PoiSelectors.getPois), take(1)).subscribe((state) => {
          this.store.dispatch(PoiActions.loadPois({ page: state.pagesLoaded + 1 }));
        });
      },
      create: (enrollment: EnrollmentStoreModel) => {
        this.store.dispatch(PoiActions.createPoi({ enrollment }));
      },
      start: (poi: PoiCmStoreModel, latLng?: LatLng) => {
        this.store.dispatch(PoiActions.startPoi({ poi, latLng }));
      },
      withdraw: (poi: PoiCmStoreModel) => {
        this.store.dispatch(PoiActions.withdrawPoi({ poi }));
      },
      pause: (poi: PoiCmStoreModel) => {
        this.store.dispatch(PoiActions.pausePoi({ poi }));
      },
      resume: (poi: PoiCmStoreModel) => {
        this.store.dispatch(PoiActions.resumePoi({ poi }));
      },
      stop: (poi: PoiCmStoreModel) => {
        this.store.dispatch(PoiActions.stopPoi({ poi }));
      },
      submit: (poi: PoiCmStoreModel, files: File[], answers: QuestionAnswersDto[]) => {
        this.store.dispatch(PoiActions.submitPoi({ poi, files, answers }));
      },
    },
    selectors: {
      pois$: this.store.pipe(select(PoiSelectors.getPois)).pipe(
        tap(({ loaded }) => {
          if (!loaded) {
            this.store.dispatch(PoiActions.loadPois({ page: 1 }));
          }
        })
      ),
      getPoi: (poiId: string) =>
        this.store.pipe(select(PoiSelectors.getPoi(poiId))).pipe(
          tap(({ loaded }) => {
            if (!loaded) {
              this.store.dispatch(PoiActions.loadPois({ page: 1 }));
            }
          })
        ),
    },
    actionListeners: {
      loadPois: {
        success: this.actions$.pipe(ofType(PoiActions.loadPoisSuccess)),
        error: this.actions$.pipe(ofType(PoiActions.loadPoisError)),
      },
    },
  };

  constructor(
    private readonly store: Store, 
    private readonly actions$: Actions,
  ) {}
}
