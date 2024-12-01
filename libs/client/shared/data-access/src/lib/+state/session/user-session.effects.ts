import { Injectable } from '@angular/core';
import { RouteService } from '@involvemint/client/shared/routes';
import { InfoModalService, StatusService, WindowRefService } from '@involvemint/client/shared/util';
import {
  BaDownloadEpAdminsQuery,
  BaSubmitEpApplicationQuery,
  environment,
  ImConfig,
  UserQuery,
} from '@involvemint/shared/domain';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { from, of } from 'rxjs';
import { delayWhen, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { ImInitLoaderService } from '../../im-init-loader/im-init-loader.service';
import { ChangeMakerRestClient } from '../../rest-clients/change-maker.rest-client';
import * as UserSessionActions from './user-session.actions';
import { ImAuthTokenStorage } from './user-session.storage';
import { EpApplicationRestClient, ExchangeAdminRestClient, SpApplicationRestClient, UserRestClient } from '../../rest-clients';

@Injectable()
export class UserSessionEffects {
  readonly userLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.userLogin),
      delayWhen(() => from(this.status.showLoader('Logging In...'))),
      fetch({
        run: ({ id, password }) =>
          this.user.login({ token: true }, { id, password }).pipe(
            tap(({ token }) => ImAuthTokenStorage.setValue({ id, token })),
            map(({ token }) => {
              this.route.to.ROOT();
              this.status.dismissLoader();
              ImAuthTokenStorage.setValue({ id, token });
              return UserSessionActions.userLoginSuccess({ id, token });
            })
          ),
        onError: (action, { error }) => {
          this.status.dismissLoader();
          (async () => {
            if (error.message?.includes('verified')) {
              const res = await this.status.presentAlertWithAction({
                alertData: {
                  title: 'Email Not Verified',
                  description: `You email address has not been verified.
                      Please see your email and click on the link to verify.
                      Or click <b>Resend</b> to resend email verification link.`,
                },
                buttonText: 'RESEND',
                buttonCssClass: 'im-alert-confirm',
              });
              if (res) {
                await this.status.showLoader('Sending...');
                try {
                  await this.user
                    .resendEmailVerificationEmail({}, { userId: action.id })
                    .pipe(take(1))
                    .toPromise();
                  await this.status.dismissLoader();
                  await this.status.presentSuccess();
                } catch (e) {
                  await this.status.dismissLoader();
                  await this.status.presentAlert({ title: 'Resend failed.', description: e.error.message });
                }
              }
            }
          })();
          return UserSessionActions.userLoginError({ error });
        },
      })
    )
  );

  readonly adminLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.adminLogin),
      delayWhen(() => from(this.status.showLoader('Logging In...'))),
      fetch({
        run: ({ password }) =>
          this.user.adminLogin({ token: true }, { password }).pipe(
            map(({ token }) => {
              // We use the localStorage to store the key `isAdmin`.
              // The `token` should be check in the server to make sure it belongs in the admin
              // for authentication reasons.
              ImAuthTokenStorage.setValue({ id: ImConfig.adminEmail, token });
              this.route.to.ROOT();
              return UserSessionActions.adminLoginSuccess({ token });
            })
          ),
        onError: (action, { error }) => {
          this.status.presentNgRxActionAlert(action, error);
          return UserSessionActions.adminLoginError({ error });
        },
      }),
      tap(() => this.status.dismissLoader())
    )
  );

  readonly userSignUp$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.userSignUp),
      delayWhen(() => from(this.status.showLoader('Signing Up...'))),
      pessimisticUpdate({
        run: ({ dto }) =>
          this.user.signUp({ token: true }, dto).pipe(
            map(({ token }) => {
              ImAuthTokenStorage.setValue({ id: dto.id, token });
              if (environment.environment !== 'local') {
                (async () => {
                  const modal = await this.infoModal.open({
                    title: 'Check your email',
                    description: "To verify your account, tap the link in the email we've sent you.",
                    icon: { name: '/assets/im-check-mail.svg', source: 'src' },
                    useBackground: false,
                  });
                  await modal.onDidDismiss();
                  await this.route.to.login.ROOT();
                })();
              } else {
                this.route.to.ROOT();
              }
              return UserSessionActions.userSignUpSuccess({ token });
            })
          ),
        onError: (action, { error }) => {
          this.status.presentNgRxActionAlert(action, error);
          return UserSessionActions.userSignUpError({ error });
        },
      }),
      tap(() => this.status.dismissLoader())
    )
  );

  readonly getUserData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.getUserData),
      tap(() => this.initLoader.show()),
      fetch({
        run: () => {
          const storage = ImAuthTokenStorage.getValue();
          if (storage?.id === ImConfig.adminEmail && storage.token) {
            return this.user.validateAdminToken({ token: true }, { token: storage.token }).pipe(
              map((token) => {
                this.initLoader.hide();
                return UserSessionActions.adminLoginSuccess(token);
              })
            );
          }

          // Token should be in localStorage at this point. (Used in Orchestra Interceptor)
          return this.user.getUserData(UserQuery).pipe(
            map((data) => {
              this.initLoader.hide();
              return UserSessionActions.getUserDataSuccess(data);
            })
          );
        },
        onError: (action, { error }) => {
          this.initLoader.hide();
          // Prevent unnecessary calls to backend when token already confirmed to be invalid.
          ImAuthTokenStorage.delete();
          return UserSessionActions.getUserDataError({ error });
        },
      })
    )
  );

  readonly baDownloadEpAdmin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.baDownloadEpAdmin),
      fetch({
        run: ({ dto }) =>
          from(
            this.status.presentAlertWithAction({
              alertData: {
                title: 'Confirm',
                description: `Are you sure you want to invite "<b>${dto.name}</b>" temporarily?`,
              },
              buttonText: 'Invite',
              buttonCssClass: 'im-alert-confirm',
            })
          ).pipe(
            filter((v) => v),
            delayWhen(() => from(this.status.showLoader('Inviting...'))),
            switchMap(() => {
              return this.exchangeAdmin.getSuperAdminForExchangePartner(BaDownloadEpAdminsQuery, dto);
            }),
            map((downloadedEpSuperAdmin) => {
              return UserSessionActions.baDownloadEpAdminSuccess({
                downloadedEpAdmin: { ...downloadedEpSuperAdmin, baDownloaded: true },
              });
            })
          ),
        onError: (action, error) => {
          this.status.presentNgRxActionAlert(action, error);
          return UserSessionActions.baDownloadEpAdminError({ error });
        },
      }),
      tap(() => this.status.dismissLoader())
    )
  );

  readonly baRemoveDownloadedEpAdmin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.baRemoveDownloadedEpAdmin),
      fetch({
        run: ({ downloadedEpAdmin }) =>
          from(
            this.status.presentAlertWithAction({
              alertData: {
                title: 'Confirm',
                description: `Are you sure you want to remove invitation for "<b>${downloadedEpAdmin.exchangePartner.email}</b>"?`,
              },
              buttonText: 'Remove',
              buttonCssClass: 'im-alert-deny',
            })
          ).pipe(
            filter((v) => v),
            delayWhen(() => from(this.status.showLoader('Removing...'))),
            map(() => {
              return UserSessionActions.baRemoveDownloadedEpAdminSuccess({ id: downloadedEpAdmin.id });
            })
          ),
        onError: (action, error) => {
          this.status.presentNgRxActionAlert(action, error);
          return UserSessionActions.baRemoveDownloadedEpAdminError({ error });
        },
      }),
      tap(() => this.status.dismissLoader())
    )
  );

  readonly baSubmitEpApplication$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.baSubmitEpApplication),
      delayWhen(() => from(this.status.showLoader('Submitting ExchangePartner Application...'))),
      pessimisticUpdate({
        run: ({ dto }) =>
          this.epApp.baSubmit(BaSubmitEpApplicationQuery, dto).pipe(
            tap(() => {
              this.status.dismissLoader();
              // open this info modal after next alert has been opened with a setTimeout
              setTimeout(() => {
                this.infoModal.open({
                  title: 'ExchangePartner Creation Successful',
                  description: `Application has automatically been approved, an email has been sent to ${dto.name} at ${dto.email} with next steps.
                              Please notify the business to check their email to activate their account and create a password.`,
                  icon: { name: 'checkmark', source: 'ionicon' },
                  useBackground: true,
                });
              }, 100);
            }),
            switchMap((newEp) =>
              from(
                this.status.presentAlertWithAction({
                  alertData: {
                    title: 'Invite a Business',
                    description: `Now that the application has been approved, would you like to temporarily add the business's ExchangePartner profile to your account? (You will need to go through the onboarding for the business)`,
                  },
                  buttonText: 'Invite',
                  cancelButtonText: "Don't Invite",
                  buttonCssClass: 'im-alert-confirm',
                })
              ).pipe(map((promptResult) => ({ newEp, promptResult })))
            ),
            switchMap(({ newEp, promptResult }) =>
              promptResult
                ? this.exchangeAdmin.getSuperAdminForExchangePartner(BaDownloadEpAdminsQuery, {
                    epId: newEp.id,
                    name: newEp.name,
                  })
                : of(undefined)
            ),
            map((downloadedEpSuperAdmin) => {
              return downloadedEpSuperAdmin
                ? UserSessionActions.baSubmitEpApplicationSuccess({
                    downloadedEpAdmin: {
                      ...downloadedEpSuperAdmin,
                      baDownloaded: true,
                    },
                  })
                : UserSessionActions.baSubmitEpApplicationSuccess({});
            })
          ),
        onError: (action, { error }) => {
          this.status.dismissLoader();
          this.status.presentNgRxActionAlert(action, error);
          return UserSessionActions.baSubmitEpApplicationError({ error });
        },
      })
    )
  );

  readonly snoop$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.snoop),
      delayWhen(() => from(this.status.showLoader('Getting our Snoop on...'))),
      fetch({
        run: ({ userId }) =>
          this.user.snoop({ ...UserQuery, token: true }, { userId }).pipe(
            map((data) => {
              ImAuthTokenStorage.setValue({ id: userId, token: data.token });
              return UserSessionActions.snoopSuccess(data);
            })
          ),
        onError: (action, { error }) => {
          this.status.presentNgRxActionAlert(action, error);
          return UserSessionActions.snoopError({ error });
        },
      }),
      tap(() => this.status.dismissLoader())
    )
  );

  readonly userLogOut$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UserSessionActions.userLogOut),
        switchMap(() =>
          from(
            this.status.presentAlertWithAction({
              alertData: {
                title: 'Confirm',
                description: `Are you sure you want to log out?`,
              },
              buttonText: 'LOG OUT',
              buttonCssClass: 'im-alert-deny',
            })
          )
        ),
        filter((v) => v),
        tap(() => {
          ImAuthTokenStorage.delete();
          if (this.windowRef.nativeWindow) {
            this.windowRef.nativeWindow.location.href = '/';
          }
        })
      ),
    { dispatch: false }
  );

  readonly createChangeMakerProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.createChangeMakerProfile),
      delayWhen(() => from(this.status.showLoader('Creating ChangeMaker Profile...'))),
      pessimisticUpdate({
        run: ({ dto }) =>
          this.cm.createProfile(UserQuery.changeMaker, dto).pipe(
            tap(async () => {
              await this.status.dismissLoader();
              await this.status.presentSuccess();
            }),
            map((cmProfile) => {
              this.route.to.cm.profile.ROOT();
              return UserSessionActions.createChangeMakerProfileSuccess({ cmProfile });
            })
          ),
        onError: (action, { error }) => {
          this.status.dismissLoader();
          this.status.presentNgRxActionAlert(action, error);
          return UserSessionActions.createChangeMakerProfileError({ error });
        },
      })
    )
  );

  readonly submitEpApplication$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.submitEpApplication),
      delayWhen(() => from(this.status.showLoader('Submitting ExchangePartner Application...'))),
      pessimisticUpdate({
        run: ({ dto }) =>
          this.epApp.submit(UserQuery.epApplications, dto).pipe(
            map((epApp) => {
              if (!ImConfig.requireApplicationApproval) {
                window.location.reload();
              }
              this.status.dismissLoader();
              this.infoModal.open({
                title: 'ExchangePartner Application Successful',
                description: `Our administrators are reviewing your request and is pending approval or denial.`,
                icon: { name: 'checkmark', source: 'ionicon' },
                useBackground: true,
              });
              return UserSessionActions.submitEpApplicationSuccess({ epApp });
            })
          ),
        onError: (action, { error }) => {
          this.status.dismissLoader();
          this.status.presentNgRxActionAlert(action, error);
          return UserSessionActions.submitEpApplicationError({ error });
        },
      })
    )
  );

  readonly withdrawEpApplication$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.withdrawEpApplication),
      pessimisticUpdate({
        run: ({ epApp }) =>
          from(
            this.status.presentAlertWithAction({
              alertData: {
                title: 'Confirm Withdrawal',
                description: `Are you sure you want to withdraw your ExchangePartner Application for <b>${epApp.name}</b>?`,
              },
              buttonText: 'WITHDRAW',
              buttonCssClass: 'im-alert-deny',
            })
          ).pipe(
            filter((v) => v),
            delayWhen(() => from(this.status.showLoader('Withdrawing...'))),
            switchMap(() => this.epApp.withdraw({ deletedId: true }, { epAppId: epApp.id })),
            tap(async () => {
              await this.status.dismissLoader();
              await this.status.presentSuccess();
            }),
            map(({ deletedId }) => {
              return UserSessionActions.withdrawEpApplicationSuccess({ deletedId });
            })
          ),
        onError: (action, { error }) => {
          this.status.dismissLoader();
          this.status.presentNgRxActionAlert(action, error);
          return UserSessionActions.withdrawEpApplicationError({ error });
        },
      })
    )
  );

  readonly submitSpApplication$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.submitSpApplication),
      delayWhen(() => from(this.status.showLoader('Submitting ServePartner Application...'))),
      pessimisticUpdate({
        run: ({ dto }) =>
          this.spApp.submit(UserQuery.spApplications, dto).pipe(
            map((spApp) => {
              if (!ImConfig.requireApplicationApproval) {
                window.location.reload();
              }
              this.status.dismissLoader();
              this.infoModal.open({
                title: 'ServePartner Application Successful',
                description: `Our administrators are reviewing your request and is pending approval or denial.`,
                icon: { name: 'checkmark', source: 'ionicon' },
                useBackground: true,
              });
              return UserSessionActions.submitSpApplicationSuccess({ spApp });
            })
          ),
        onError: (action, { error }) => {
          this.status.dismissLoader();
          this.status.presentNgRxActionAlert(action, error);
          return UserSessionActions.submitSpApplicationError({ error });
        },
      })
    )
  );

  readonly withdrawSpApplication$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.withdrawSpApplication),
      pessimisticUpdate({
        run: ({ spApp }) =>
          from(
            this.status.presentAlertWithAction({
              alertData: {
                title: 'Confirm Withdrawal',
                description: `Are you sure you want to withdraw your SpendPartner Application for <b>${spApp.name}</b>?`,
              },
              buttonText: 'WITHDRAW',
              buttonCssClass: 'im-alert-deny',
            })
          ).pipe(
            filter((v) => v),
            delayWhen(() => from(this.status.showLoader('Withdrawing...'))),
            switchMap(() => this.spApp.withdraw({ deletedId: true }, { spAppId: spApp.id })),
            tap(async () => {
              await this.status.dismissLoader();
              await this.status.presentSuccess();
            }),
            map(({ deletedId }) => {
              return UserSessionActions.withdrawSpApplicationSuccess({ deletedId });
            })
          ),
        onError: (action, { error }) => {
          this.status.dismissLoader();
          this.status.presentNgRxActionAlert(action, error);
          return UserSessionActions.withdrawSpApplicationError({ error });
        },
      })
    )
  );

  readonly changePassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.changePassword),
      delayWhen(() => from(this.status.showLoader('Changing Password...'))),
      pessimisticUpdate({
        run: ({ dto }) =>
          this.user.changePassword({}, dto).pipe(
            tap(async () => {
              await this.status.dismissLoader();
              await this.status.presentSuccess();
            }),
            map(() => {
              return UserSessionActions.changePasswordSuccess();
            })
          ),
        onError: (action, { error }) => {
          this.status.dismissLoader();
          this.status.presentNgRxActionAlert(action, error);
          return UserSessionActions.changePasswordError({ error });
        },
      })
    )
  );

  readonly finishJoyride$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.finishJoyride),
      pessimisticUpdate({
        run: () =>
          this.user.finishJoyride({}).pipe(
            map(() => {
              return UserSessionActions.finishJoyrideSuccess();
            })
          ),
        onError: (action, { error }) => {
          this.status.dismissLoader();
          this.status.presentNgRxActionAlert(action, error);
          return UserSessionActions.finishJoyrideError({ error });
        },
      })
    )
  );

  constructor(
    private readonly actions$: Actions,
    private readonly user: UserRestClient,
    private readonly exchangeAdmin: ExchangeAdminRestClient,
    private readonly route: RouteService,
    private readonly cm: ChangeMakerRestClient,
    private readonly status: StatusService,
    private readonly windowRef: WindowRefService,
    private readonly epApp: EpApplicationRestClient,
    private readonly spApp: SpApplicationRestClient,
    private readonly infoModal: InfoModalService,
    private readonly initLoader: ImInitLoaderService
  ) {}
}
