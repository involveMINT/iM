import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ClientAdminDataAccessModule } from '@involvemint/client/admin/data-access';
import { ImRoutes } from '@involvemint/shared/domain';

@NgModule({
  imports: [
    ClientAdminDataAccessModule,
    RouterModule.forChild([
      {
        path: ImRoutes.admin.applications.ROOT,
        loadChildren: () =>
          import('./applications/applications.module').then((m) => m.AdminApplicationsModule),
      },
      {
        path: ImRoutes.admin.privileges.ROOT,
        loadChildren: () => import('./privileges/privileges.module').then((m) => m.AdminPrivilegesModule),
      },
      {
        path: ImRoutes.admin.mint.ROOT,
        loadChildren: () => import('./mint/mint.module').then((m) => m.AdminMintModule),
      },
      {
        path: ImRoutes.admin.users.ROOT,
        loadChildren: () => import('./users/users.module').then((m) => m.UsersModule),
      },
      {
        path: ImRoutes.admin.moderation.ROOT,
        loadChildren: () => import('./moderation/moderation.module').then((m) => m.AdminModerationModule),
      },
    ]),
  ],
})
export class ClientAdminShellModule {}
