import { HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PoiOrchestration, UserFacade } from '@involvemint/client/shared/data-access';
import { RouteService } from '@involvemint/client/shared/routes';
import { StatusService } from '@involvemint/client/shared/util';
import { calculatePoiStatus, PoiCmQuery, PoiStatus } from '@involvemint/shared/domain';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { from } from 'rxjs';
import { delayWhen, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { ChangeMakerFacade } from '../change-maker.facade';
import * as PoisActions from './pois.actions';

@Injectable()
export class PoiEffects {
  readonly loadPois$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PoisActions.loadPois),
      fetch({
        run: ({ page }) =>
          this.user.session.selectors.changeMaker$.pipe(
            take(1),
            switchMap((cm) => {
              if (!cm) {
                throw new Error('No ChangeMaker in store.');
              }
              return this.pois.get({
                ...PoiCmQuery,
                __paginate: {
                  ...PoiCmQuery.__paginate,
                  page,
                },
              });
            }),
            map((pois) => PoisActions.loadPoisSuccess({ pois: pois.items, page: page }))
          ),
        onError: (action, { error }) => {
          this.status.presentNgRxActionAlert(action, error);
          return PoisActions.loadPoisError({ error });
        },
      })
    )
  );

  readonly createPoi$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PoisActions.createPoi),
      delayWhen(() => from(this.status.showLoader('Creating...'))),
      pessimisticUpdate({
        run: ({ enrollment }) =>
          this.cf.poi.selectors.pois$.pipe(
            filter(({ loaded }) => loaded),
            take(1),
            filter(({ pois }) => {
              const hasOneCreated = pois.find(
                (poi) => calculatePoiStatus(poi) === PoiStatus.created && poi.enrollment.id === enrollment.id
              );
              if (hasOneCreated) {
                this.route.to.cm.pois.POI(hasOneCreated.id);
                this.status.dismissLoader();
                return false;
              }
              return true;
            }),
            switchMap(() => this.pois.create(PoiCmQuery, { enrollmentId: enrollment.id })),
            delayWhen(({ id }) => from(this.route.to.cm.pois.POI(id))),
            map((poi) => PoisActions.createPoiSuccess({ poi }))
          ),
        onError: (action, { error }) => {
          if (typeof error.response === 'object' && error.response.code === 'poiAlreadyExists') {
            this.status
              .presentAlertWithAction({
                alertData: { title: 'Unsubmitted POI', description: error.response.text },
                buttonText: 'View POI',
                buttonCssClass: 'im-alert-confirm',
              })
              .then((res) => {
                if (res) {
                  this.route.to.cm.pois.POI(error.response.id);
                }
              });
          } else {
            this.status.presentNgRxActionAlert(action, error);
          }

          return PoisActions.createPoiError({ error });
        },
      }),
      tap(() => this.status.dismissLoader())
    )
  );

  readonly startPoi$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PoisActions.startPoi),
      delayWhen(() => from(this.status.showLoader('Starting...'))),
      pessimisticUpdate({
        run: ({ poi, latLng }) =>
          this.pois
            .start(PoiCmQuery, {
              poiId: poi.id,
              latitude: latLng?.lat,
              longitude: latLng?.lng,
            })
            .pipe(
              delayWhen(({ id }) => from(this.route.to.cm.pois.POI(id))),
              map((poi) => PoisActions.startPoiSuccess({ poi }))
            ),
        onError: (action, { error }) => {
          this.status.presentNgRxActionAlert(action, error);
          return PoisActions.startPoiError({ error });
        },
      }),
      tap(() => this.status.dismissLoader())
    )
  );

  readonly withdrawPoi$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PoisActions.withdrawPoi),
      pessimisticUpdate({
        run: ({ poi }) =>
          from(
            this.status.presentAlertWithAction({
              alertData: {
                title: `Confirm Withdrawal`,
                description: `This withdraws and <b>permanently deletes</b> your POI to <b>${poi.enrollment.project.title}</b>.`,
              },
              buttonText: 'WITHDRAW',
              buttonCssClass: 'im-alert-deny',
            })
          ).pipe(
            filter((v) => v),
            delayWhen(() => from(this.status.showLoader('Withdrawing...'))),
            switchMap(() => this.pois.withdraw({ deletedId: true }, { poiId: poi.id })),
            delayWhen(() => from(this.route.to.cm.profile.ROOT())),
            map(({ deletedId }) => PoisActions.withdrawPoiSuccess({ deletedId }))
          ),
        onError: (action, { error }) => {
          this.status.presentNgRxActionAlert(action, error);
          return PoisActions.withdrawPoiError({ error });
        },
      }),
      tap(() => this.status.dismissLoader())
    )
  );

  readonly pausePoi$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PoisActions.pausePoi),
      delayWhen(() => from(this.status.showLoader('Pausing...'))),
      pessimisticUpdate({
        run: ({ poi }) =>
          this.pois
            .pause(PoiCmQuery, { poiId: poi.id })
            .pipe(map((poi) => PoisActions.pausePoiSuccess({ poi }))),
        onError: (action, { error }) => {
          this.status.presentNgRxActionAlert(action, error);
          return PoisActions.pausePoiError({ error });
        },
      }),
      tap(() => this.status.dismissLoader())
    )
  );

  readonly resumePoi$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PoisActions.resumePoi),
      delayWhen(() => from(this.status.showLoader('Resuming...'))),
      pessimisticUpdate({
        run: ({ poi }) =>
          this.pois
            .resume(PoiCmQuery, { poiId: poi.id })
            .pipe(map((poi) => PoisActions.resumePoiSuccess({ poi }))),
        onError: (action, { error }) => {
          this.status.presentNgRxActionAlert(action, error);
          return PoisActions.resumePoiError({ error });
        },
      }),
      tap(() => this.status.dismissLoader())
    )
  );

  readonly stopPoi$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PoisActions.stopPoi),
      pessimisticUpdate({
        run: ({ poi }) =>
          from(
            this.status.presentAlertWithAction({
              alertData: {
                title: `Confirm Clock Out`,
                description: `Are you sure you want to Clock Out? You will not be able to Clock back in.`,
              },
              buttonText: 'CLOCK OUT',
              buttonCssClass: 'im-alert-deny',
            })
          ).pipe(
            filter((v) => v),
            delayWhen(() => from(this.status.showLoader('Clocking Out...'))),
            switchMap(() => this.pois.stop(PoiCmQuery, { poiId: poi.id })),
            map((poi) => PoisActions.stopPoiSuccess({ poi }))
          ),
        onError: (action, { error }) => {
          this.status.presentNgRxActionAlert(action, error);
          return PoisActions.stopPoiError({ error });
        },
      }),
      tap(() => this.status.dismissLoader())
    )
  );

  readonly submitPoi$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PoisActions.submitPoi),
      pessimisticUpdate({
        run: ({ poi, files, answers }) =>
          from(
            this.status.presentAlertWithAction({
              alertData: {
                title: `Confirm Submission`,
                description: `This submits your POI to <b>${poi.enrollment.project.title}</b>.`,
              },
              buttonText: 'SUBMIT',
              buttonCssClass: 'im-alert-confirm',
            })
          ).pipe(
            filter((v) => v),
            delayWhen(() => from(this.status.showLoader('Submitting...'))),
            switchMap(() => this.pois.submit(PoiCmQuery, { poiId: poi.id, answers }, files)),
            map((event) => {
              switch (event.type) {
                case HttpEventType.UploadProgress:
                  {
                    const progress = Math.round((100 * event.loaded) / (event.total ?? 1));
                    this.status.changeLoaderMessage(`Submitting POI...${(progress ?? 0).toFixed(0)}%`);
                  }
                  break;
                case HttpEventType.Response:
                  return event.body;
              }
              return undefined;
            }),
            filter((body) => !!body),
            map((poi) => {
              if (!poi) throw new Error('No POI Emitted!');
              this.user.posts.dispatchers.create({poiId: poi.id});
              return PoisActions.submitPoiSuccess({ poi });
            })
          ),
        onError: (action, { error }) => {
          this.status.presentNgRxActionAlert(action, error);
          return PoisActions.submitPoiError({ error });
        },
      }),
      tap(() => this.status.dismissLoader())
    )
  );

  constructor(
    private readonly actions$: Actions,
    private readonly pois: PoiOrchestration,
    private readonly user: UserFacade,
    private readonly status: StatusService,
    private readonly route: RouteService,
    private readonly cf: ChangeMakerFacade
  ) {}
}
