import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild } from '@angular/core';
import { ImViewProfileModalService, PostStoreModel, UserFacade } from '@involvemint/client/shared/data-access';
import { map, tap } from 'rxjs/operators';

import { IonContent, ModalController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { CommentStoreModel } from 'libs/client/shared/data-access/src/lib/+state/comments/comments.reducer';
import { StatefulComponent } from '@involvemint/client/shared/util';

interface State {
  comments: Array<CommentStoreModel>;
  loaded: boolean;
}

@Component({
  selector: 'app-modal-comments',
  templateUrl: 'modal-comments.component.html',
  styleUrls: ['./modal-comments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalCommentComponent extends StatefulComponent<State> implements OnInit {
  @ViewChild(IonContent)
  content!: IonContent;
  @Input() post!: PostStoreModel;
  msg!: string;
  profilePicFilePath!: string;
  name$!: Observable<string>;
  handleID!: string;

constructor(
  private modalCtrl: ModalController,
  private user: UserFacade,
  private readonly viewProfileModal: ImViewProfileModalService,
) {
  super({ comments: [], loaded: true });
}

ngOnInit() {
  this.user.comments.dispatchers.initComments(this.post.comments);
  this.effect(() => 
    this.user.comments.selectors.comments$.pipe(
      tap(({ comments }) => 
        this.updateState({
          comments: comments
        }))
    )
  );

  this.handleID = this.getHandleID();
  this.name$ = this.getName();
  this.profilePicFilePath = this.getProfilePic();
}

  hide(id: string) {
    this.user.comments.dispatchers.hideComment({
      commentId: id,
    })
  }

  unhide(id: string) {
    this.user.comments.dispatchers.unhideComment({
      commentId: id,
    })
  }

  checkCommentHidden(comment: CommentStoreModel) {
    let userId = "";
    this.user.session.selectors.email$.subscribe(s => userId = s);
    return comment.hidden
  }

  viewProfile(handle: string) {
    this.viewProfileModal.open({ handle });
  }

  getProfilePic() {
    const profilePicObservable: Observable<string> = this.user.session.selectors.changeMaker$.pipe(
      map(changeMaker => changeMaker?.profilePicFilePath || '')
    );
    let profilePic: string = '';
    profilePicObservable.subscribe(
      (url: string) => {
        profilePic = url;
      }
    );
    return profilePic;
    }
  
  getName(): Observable<string> {
    return this.user.session.selectors.changeMaker$.pipe(
      map(changeMaker => `${changeMaker?.firstName || ''} ${changeMaker?.lastName || ''}` || '')
    );
  }

  getHandleID() {
    const handleIDObservable: Observable<string> = this.user.session.selectors.activeProfile$.pipe(
      map(activeProfile => activeProfile.handle.id)
    )
    let handleID: string = '';
    handleIDObservable.subscribe(
      (url: string) => {
        handleID = url;
      }
    );
    return handleID;
  }

  cancel() {
    return this.modalCtrl.dismiss(this.state.comments, 'cancel');
  }

}
