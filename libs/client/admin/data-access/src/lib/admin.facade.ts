import { Injectable } from '@angular/core';
import {
  GrantBaPrivilegesDto,
  HideCommentDto,
  MintDto,
  ProcessEpApplicationDto,
  ProcessSpApplicationDto,
  RevokeBaPrivilegesDto,
  UnhideCommentDto,
} from '@involvemint/shared/domain';
import { Actions, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { take, tap } from 'rxjs/operators';
import * as ApplicationsActions from './applications/applications.actions';
import * as ApplicationsSelectors from './applications/applications.selectors';
import * as CreditsActions from './credits/credits.actions';
import * as PrivilegesActions from './privileges/privileges.actions';
import * as PrivilegesSelectors from './privileges/privileges.selectors';

@Injectable()
export class AdminFacade {

  readonly applications = {
    selectors: {
      state$: this.store.pipe(select(ApplicationsSelectors.getState)).pipe(
        tap(({ loaded }) => {
          if (!loaded) {
            this.store.dispatch(ApplicationsActions.loadApplications());
          }
        })
      ),
    },

    actionListeners: {
      loadApplications: {
        success: this.actions$.pipe(ofType(ApplicationsActions.loadApplicationsSuccess)),
        error: this.actions$.pipe(ofType(ApplicationsActions.loadApplicationsError)),
      },
      processEpApplication: {
        success: this.actions$.pipe(ofType(ApplicationsActions.processEpApplicationSuccess)),
        error: this.actions$.pipe(ofType(ApplicationsActions.processEpApplicationError)),
      },
      processSpApplication: {
        success: this.actions$.pipe(ofType(ApplicationsActions.processSpApplicationSuccess)),
        error: this.actions$.pipe(ofType(ApplicationsActions.processSpApplicationError)),
      },
    },

    dispatchers: {
      refresh: () => {
        this.store.dispatch(ApplicationsActions.refreshApplications());
      },
      processEpApplication: (dto: ProcessEpApplicationDto) => {
        this.store.dispatch(ApplicationsActions.processEpApplication({ dto }));
      },
      processSpApplication: (dto: ProcessSpApplicationDto) => {
        this.store.dispatch(ApplicationsActions.processSpApplication({ dto }));
      },
    },
  };

  readonly privileges = {
    selectors: {
      state$: this.store.pipe(select(PrivilegesSelectors.getState)).pipe(
        tap(({ loaded }) => {
          if (!loaded) {
            this.store.dispatch(PrivilegesActions.loadPrivileges());
          }
        })
      ),
    },

    actionListeners: {
      loadPrivileges: {
        success: this.actions$.pipe(ofType(PrivilegesActions.loadPrivilegesSuccess)),
        error: this.actions$.pipe(ofType(PrivilegesActions.loadPrivilegesError)),
      },
      grantBAPrivilege: {
        success: this.actions$.pipe(ofType(PrivilegesActions.grantBAPrivilegeSuccess)),
        error: this.actions$.pipe(ofType(PrivilegesActions.grantBAPrivilegeError)),
      },
      revokeBAPrivilege: {
        success: this.actions$.pipe(ofType(PrivilegesActions.revokeBAPrivilegeSuccess)),
        error: this.actions$.pipe(ofType(PrivilegesActions.revokeBAPrivilegeError)),
      },
    },

    dispatchers: {
      refresh: () => {
        this.store.dispatch(PrivilegesActions.refreshPrivileges());
      },
      grantBAPrivilege: (dto: GrantBaPrivilegesDto) => {
        this.store.dispatch(PrivilegesActions.grantBAPrivilege({ dto }));
      },
      revokeBAPrivilege: (dto: RevokeBaPrivilegesDto) => {
        this.store.dispatch(PrivilegesActions.revokeBAPrivilege({ dto }));
      },
    },
  };

  readonly credits = {
    dispatchers: {
      mint: (dto: MintDto) => {
        this.store.dispatch(CreditsActions.mint({ dto }));
      },
    },
    actionListeners: {
      mint: {
        success: this.actions$.pipe(ofType(CreditsActions.mintSuccess)),
        error: this.actions$.pipe(ofType(CreditsActions.mintError)),
      },
    },
  };

  constructor(private readonly store: Store, private readonly actions$: Actions) {}
}
