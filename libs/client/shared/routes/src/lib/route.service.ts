import { Location } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RxJSBaseClass } from '@involvemint/client/shared/util';
import { FrontendRoutes, IFrontendRoutes } from '@involvemint/shared/domain';
import { IRoute } from '@involvemint/shared/util';
import { NavController } from '@ionic/angular';
import { RouterDirection } from '@ionic/core/dist/types/components/router/utils/interface';
import cloneDeep from 'lodash/cloneDeep';
import { FRONTEND_ROUTES } from './tokens';

interface IRouteOptions {
  animation?: RouterDirection;
  replaceUrl?: boolean;
  queryParams?: Record<string, string | number | undefined>;
}

// eslint-disable-next-line @typescript-eslint/ban-types
type Routes<T extends {}> = {
  [K in keyof T]: T[K] extends string
    ? (ro?: IRouteOptions) => Promise<boolean>
    : T[K] extends number
    ? (id: string, ro?: IRouteOptions) => Promise<boolean>
    : Routes<T[K]>;
};

@Injectable({ providedIn: 'root' })
export class RouteService extends RxJSBaseClass {
  ROOT = '';

  to!: Routes<IFrontendRoutes>;

  constructor(
    @Inject(FRONTEND_ROUTES) private _routes: FrontendRoutes,
    private readonly router: Router,
    private readonly nav: NavController,
    private readonly location: Location
  ) {
    super();

    this.to = this.createRoutes();
  }

  back(backUpRoute: () => unknown) {
    const { navigationId } = this.location.getState() as { navigationId: number };
    if (navigationId <= 1) {
      return backUpRoute();
    }
    this.location.back();
  }

  get rawRoutes(): FrontendRoutes {
    return this._routes;
  }

  /**
   * Transforms the route names into objects of functions that go to the given path
   */
  createRoutes(): Routes<IFrontendRoutes> {
    const traverse = (obj: IRoute): Routes<IFrontendRoutes> => {
      let ROOT = '';

      for (const k in obj) {
        if (k === 'ROOT') ROOT = obj[k].toString();
        switch (typeof obj[k]) {
          case 'object':
            traverse(obj[k] as IRoute);
            break;

          case 'string':
            {
              // Important to store this name in memory b/c it will change
              const path = obj[k] as string;
              obj[k] = ((ro?: IRouteOptions) => {
                return this.goToRoute(path, ro);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              }) as any;
            }
            break;

          case 'number':
            {
              // Important to store this name in memory b/c it will change
              const path = ROOT;
              obj[k] = ((id: string, ro?: IRouteOptions) => {
                return this.goToRoute(`${path}/${id}`, ro);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              }) as any;
            }
            break;
        }
      }
      console.log('3', obj);
      return obj as unknown as Routes<IFrontendRoutes>;
    };
    console.log('4');
    return traverse({ ...cloneDeep(this._routes.path), ROOT: '' });
  }

  private goToRoute(url: string, ro?: IRouteOptions | IRouteOptions) {
    const direction = ro?.animation ?? 'root';
    this.nav.setDirection(direction);
    return this.router.navigate([url], {
      replaceUrl: ro?.replaceUrl,
      queryParams: ro?.queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
