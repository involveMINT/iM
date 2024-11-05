import { HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@involvemint/shared/domain';
import { OrchaInterceptor } from '@orcha/angular';
import { ORCHA_TOKEN } from '@orcha/common';
import { Observable } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { ImAuthTokenStorage } from './+state/session/user-session.storage';

@Injectable()
export class AuthInterceptor implements OrchaInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const headers = req.headers;
    const body = req.body as FormData;

    const userToken = ImAuthTokenStorage.getValue();
    if (body) {
      body.set(ORCHA_TOKEN, userToken?.token ?? '');
    }

    const authReq = req.clone({ headers, body });
    return (
      next
        .handle(authReq)
        // Simulate HTTP delay for development.
        .pipe(environment.production || environment.test ? tap() : delay(Math.floor(Math.random() * (400 - 50 + 1) + 50)))
    );
  }
}
