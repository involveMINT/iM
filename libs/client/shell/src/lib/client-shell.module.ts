import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClientCmApiModule } from '@involvemint/client/cm/api';
import {
  ImBlockModule,
  ImHandleModule,
  ImHandleSearchModalModule,
  ImStorageUrlPipeModule,
  ImUserSearchModalModule,
  ImVoucherModalModule,
} from '@involvemint/client/shared/data-access';
import {
  ImCodeItemModule,
  ImFormsModule,
  ImInfoPopUpModule,
  ImTabsModule,
} from '@involvemint/client/shared/ui';
import { ImRoutes } from '@involvemint/shared/domain';
import { IonicModule } from '@ionic/angular';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { JoyrideModule } from 'ngx-joyride';
import { AdminGuard } from './guards/admin.guard';
import { AuthGuard } from './guards/auth.guard';
import { CmGuard } from './guards/cm.guard';
import { EpGuard } from './guards/ep.guard';
import { ImAppGuard } from './guards/im-app.guard';
import { LoginGuard } from './guards/login.guard';
import { SpGuard } from './guards/sp.guard';
import { ImAppComponent } from './im-app/im-app.component';
import { ImWelcomeModalModule } from './im-welcome-modal/im-welcome-modal.module';
import { WalletComponent } from './wallet/wallet.component';

@NgModule({
  declarations: [ImAppComponent, WalletComponent],
  providers: [ImAppGuard, AuthGuard, CmGuard, SpGuard, EpGuard, LoginGuard, AdminGuard],
  imports: [
    CommonModule,
    IonicModule,
    ImTabsModule,
    CurrencyMaskModule,
    FormsModule,
    ReactiveFormsModule,
    ImFormsModule,
    ImBlockModule,
    ImHandleModule,
    ImUserSearchModalModule,
    ImHandleSearchModalModule,
    ImCodeItemModule,
    ImVoucherModalModule,
    ImInfoPopUpModule,
    ImWelcomeModalModule,
    JoyrideModule,
    ClientCmApiModule,
    ImStorageUrlPipeModule,
    RouterModule.forChild([
      {
        path: ImRoutes.login.ROOT,
        loadChildren: () => import('@involvemint/client/login').then((m) => m.LoginPageModule),
        canLoad: [LoginGuard],
      },
      {
        path: ImRoutes.signUp.ROOT,
        loadChildren: () => import('@involvemint/client/login').then((m) => m.SignUpModule),
        canLoad: [LoginGuard],
      },
      {
        path: ImRoutes.activateUserAccount.ROOT,
        loadChildren: () => import('@involvemint/client/login').then((m) => m.ActivateUserAccountModule),
        canLoad: [LoginGuard],
      },
      {
        path: ImRoutes.forgotPassword.ROOT,
        loadChildren: () => import('@involvemint/client/login').then((m) => m.ForgotPasswordModule),
        canLoad: [LoginGuard],
      },
      {
        path: ImRoutes.forgotPasswordChange.ROOT,
        loadChildren: () => import('@involvemint/client/login').then((m) => m.ForgotPasswordChangeModule),
        canLoad: [LoginGuard],
      },
      {
        path: ImRoutes.verifyEmail.ROOT,
        loadChildren: () => import('@involvemint/client/login').then((m) => m.VerifyEmailModule),
        canActivate: [ImAppGuard],
      },
      {
        path: '',
        component: ImAppComponent,
        canActivate: [ImAppGuard],
        children: [
          {
            path: ImRoutes.cm.ROOT,
            canLoad: [CmGuard],
            // eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
            loadChildren: () => import('@involvemint/client/cm/shell').then((m) => m.ClientCmShellModule),
          },
          {
            path: ImRoutes.sp.ROOT,
            canLoad: [SpGuard],
            loadChildren: () => import('@involvemint/client/sp/shell').then((m) => m.ClientSpShellModule),
          },
          {
            path: ImRoutes.ep.ROOT,
            canLoad: [EpGuard],
            loadChildren: () => import('@involvemint/client/ep/shell').then((m) => m.ClientEpShellModule),
          },
          {
            path: ImRoutes.ba.ROOT,
            // canLoad: [BaGuard],
            loadChildren: () => import('@involvemint/client/ba/shell').then((m) => m.ClientBaShellModule),
          },
          {
            path: ImRoutes.admin.ROOT,
            canLoad: [AdminGuard],
            loadChildren: () =>
              import('@involvemint/client/admin/shell').then((m) => m.ClientAdminShellModule),
          },
          {
            path: ImRoutes.activityfeed.ROOT,
            loadChildren: () => import('./activityfeed/activityfeed.module').then((m) => m.ActivityFeedModule),
          },
          {
            path: ImRoutes.projects.ROOT,
            loadChildren: () => import('./projects/projects.module').then((m) => m.ProjectsModule),
          },
          {
            path: ImRoutes.market.ROOT,
            loadChildren: () => import('./market/market.module').then((m) => m.MarketModule),
          },
          {
            path: ImRoutes.settings.ROOT,
            loadChildren: () => import('./settings/settings.module').then((m) => m.SettingsModule),
          },
          {
            path: ImRoutes.wallet.ROOT,
            component: WalletComponent,
            canActivate: [AuthGuard],
          },
          {
            path: ImRoutes.chat.ROOT,
            loadChildren: () => import('./chat/chat.module').then((m) => m.ChatModule),
            canLoad: [AuthGuard],
          },
          {
            path: ImRoutes.applications.ROOT,
            children: [
              {
                path: ImRoutes.applications.cm.ROOT,
                canLoad: [AuthGuard],
                loadChildren: () =>
                  import('./applications/create-cm-profile/create-cm-profile.module').then(
                    (m) => m.CreateCmProfileModule
                  ),
              },
              {
                path: ImRoutes.applications.ep.ROOT,
                canLoad: [AuthGuard],
                loadChildren: () =>
                  import('./applications/ep-application/ep-application.module').then(
                    (m) => m.EpApplicationModule
                  ),
              },
              {
                path: ImRoutes.applications.sp.ROOT,
                canLoad: [AuthGuard],
                loadChildren: () =>
                  import('./applications/sp-application/sp-application.module').then(
                    (m) => m.SpApplicationModule
                  ),
              },
            ],
          },
          { path: '**', redirectTo: ImRoutes.projects.ROOT, pathMatch: 'full' },
        ],
      },
      { path: '**', redirectTo: '', pathMatch: 'full' },
    ]),
  ],
})
export class ClientShellModule {}
