import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild } from '@angular/core';
import { ImViewProfileModalService, PostStoreModel, UserFacade } from '@involvemint/client/shared/data-access';
import { map, tap } from 'rxjs/operators';

import { AlertController, IonContent, ModalController, ActionSheetController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { CommentStoreModel } from 'libs/client/shared/data-access/src/lib/+state/comments/comments.reducer';
import { StatefulComponent } from '@involvemint/client/shared/util';
import { compareDesc } from 'date-fns';
import { parseDate } from '@involvemint/shared/util';
import BadWords from 'bad-words';

const errorHeader = 'Error';
const flagHeader = 'You flagged this comment!';
const isAgainstCommunityGuidelinesErrorMessage = 'This comment goes against our community guidelines.';
const flagMessage = "Thank you for flagging this comment. We will review it to see if it goes against our community guidelines and take action if neccesary."

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
  @ViewChild(IonContent) content!: IonContent;
  @ViewChild('popover') popover: any;
  @Input() post!: PostStoreModel;
  isOpen!: boolean;
  msg!: string;
  profilePicFilePath!: string;
  name!: string;
  handleID!: string;

  constructor(
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
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
              .sort((a, b) => 
                compareDesc(parseDate(a.dateCreated ?? new Date()), parseDate(b.dateCreated ?? new Date()))
              )
          })
        )
      )
    );

    this.isOpen = false;
    this.msg = '';
    this.handleID = this.getHandleID();
    this.name = this.getName();
    this.profilePicFilePath = this.getProfilePic();
  }

  comment() {
    const badWords = new BadWords();
    const containsBadWord = badWords.isProfane(this.msg);
    if (!(this.msg === '') && !containsBadWord) {
      this.user.comments.dispatchers.createComment({
        postId: this.post.id,
        text: this.msg,
        commentsId: '',
        handleId: this.handleID,
        name: this.name,
        profilePicFilePath: this.profilePicFilePath
      });

      // empty the "post comment" field
      this.msg = '';

      // give time to render comment, then scroll to the top
      setTimeout(() => {
        this.content.scrollToTop(1000);
      }, 1000);
    } else if (containsBadWord) {
      this.presentMessage(errorHeader, isAgainstCommunityGuidelinesErrorMessage);
    }
  }

  viewProfile(handle: string) {
    this.viewProfileModal.open({ handle });
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
    
  getName() {
    const nameObservable: Observable<string> = this.user.session.selectors.changeMaker$.pipe(
      map(changeMaker => `${changeMaker?.firstName || ''} ${changeMaker?.lastName || ''}` || '')
    );
    let name: string = '';
    nameObservable.subscribe(
      (url: string) => {
        name = url;
      }
    );
    return name;
  }
  
  flag(id: string) {
    this.user.comments.dispatchers.flagComment({
      commentId: id,
    })
  }

  checkUserFlagged(comment: CommentStoreModel) {
    let userId = "";
    this.user.session.selectors.email$.subscribe(s => userId = s);
    const filteredObj = comment.flags.filter(obj => obj.user.id === userId);
    return filteredObj.length != 0
  }

  checkCommentHidden(comment: CommentStoreModel) {
    let userId = "";
    this.user.session.selectors.email$.subscribe(s => userId = s);
    return comment.hidden
  }

  trackComment(index: number, comment: CommentStoreModel) {
    return comment.id;
  }
  
  cancel() {
    return this.modalCtrl.dismiss(this.state.comments, 'cancel');
  }

  async presentMessage(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK'],
    });

    await alert.present();
  }

  async presentCommentActions(commentId: string, comment: CommentStoreModel) {
    (await this.actionSheetController.create({
      buttons: [
        {
          text: 'Flag this comment.',
          handler: () => {
            if (!this.checkUserFlagged(comment)) {
              this.flag(commentId);
              this.presentMessage(flagHeader, flagMessage)
            }
          },
          icon: 'flag-outline'
        },
      ]
    })).present();
  }
}
