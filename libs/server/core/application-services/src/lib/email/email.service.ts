import { environment, FrontendRoutes, FRONTEND_ROUTES_TOKEN, SignUpDto } from '@involvemint/shared/domain';
import { Inject, Injectable } from '@nestjs/common';
import * as mailgun from 'mailgun-js';

@Injectable()
export class EmailService {
  mg = environment.production || environment.test ? mailgun.default(environment.mailgun) : null;
  noreply = 'your no reply <noreply@example.com>';

  shouldNotSendNotification = !environment.production && !environment.test;

  constructor(@Inject(FRONTEND_ROUTES_TOKEN) private readonly route: FrontendRoutes) { }

  sendInfoEmail({
    user,
    message,
    subject,
    email,
  }: {
    user?: string;
    message: string;
    subject: string;
    email: string | string[];
  }) {
    if (this.shouldNotSendNotification) return;

    const msg = {
      from: this.noreply,
      to: Array.isArray(email) ? email.join(', ') : email,
      subject,
      template: 'im-info', // Will need to have this created in Mailgun
      'v:data': message,
      'v:name': user || 'involveMINT user',
    };

    return this.mg?.messages().send(msg);
  }

  sendEmailVerification(email: string, hash: string, registerAs?: SignUpDto['registerAs']) {
    if (this.shouldNotSendNotification) return;

    const url = `${environment.appUrl}${this.route.path.verifyEmail.ROOT}?email=${email}&hash=${hash}&register=${registerAs}`;

    const msg = {
      from: this.noreply,
      to: email,
      subject: 'Verify your involveMINT Email',
      template: 'im-verify-email', // Will need to have this created in Mailgun
      'v:email': email || 'involveMINT User',
      'v:url': url,
    };

    return this.mg?.messages().send(msg);
  }

  sendForgotPassword(email: string, hash: string) {
    if (this.shouldNotSendNotification) return;

    const url = `${environment.appUrl}${this.route.path.forgotPasswordChange.ROOT}?email=${email}&hash=${hash}`;

    const msg = {
      from: this.noreply,
      to: email,
      subject: 'Reset your involveMINT Password',
      template: 'im-forgot-password', // Will need to have this created in Mailgun
      'v:email': email || 'involveMINT User',
      'v:url': url,
    };

    return this.mg?.messages().send(msg);
  }

  sendActivateBusinessUserAccount(
    baAdminName: string | undefined,
    baAdminEmail: string,
    newUserEmail: string,
    newEpId: string,
    activationHash: string,
    temporaryPassword: string,
    forgotPasswordHash: string
  ) {
    if (this.shouldNotSendNotification) return;

    const url = `${environment.appUrl}${this.route.path.activateUserAccount.ROOT}?email=${newUserEmail}&epId=${newEpId}&activationHash=${activationHash}&temporaryPassword=${temporaryPassword}&forgotPasswordHash=${forgotPasswordHash}`;

    const msg = {
      from: this.noreply,
      to: newUserEmail,
      cc: baAdminEmail,
      subject: 'involveMINT - Activate your Business ExchangePartner account',
      template: 'im-activate-business-user-account', // Will need to have this created in Mailgun
      'v:sender': baAdminName || 'An involveMINT admin',
      'v:email': newUserEmail || 'involveMINT User',
      'v:url': url,
    };

    return this.mg?.messages().send(msg);
  }
}
