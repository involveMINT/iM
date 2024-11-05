import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ImBlockModule, ImStorageUrlPipeModule, ImagesViewerModalModule } from '@involvemint/client/shared/data-access';
import { ImFormsModule, ImImageModule, ImTabsModule } from '@involvemint/client/shared/ui';
import { IonicModule } from '@ionic/angular';
import { ModerationComponent } from './moderation.component';
import { ModalCommentComponent } from './comments/modal-comments.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [ModerationComponent, ModalCommentComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ImBlockModule,
    ImTabsModule,
    ImFormsModule,
    ReactiveFormsModule,
    ImImageModule,
    ImStorageUrlPipeModule,
    ImagesViewerModalModule,
    RouterModule.forChild([
      {
        path: '',
        component: ModerationComponent,
      },
    ]),
  ],
})
export class AdminModerationModule {}
