import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import {
  ChangeMakerFacade,
  PoiCmStoreModel,
} from '@involvemint/client/cm/data-access';
import { UserFacade, PostStoreModel, ImViewProfileModalService, ChatService } from '@involvemint/client/shared/data-access';
import { StatefulComponent } from '@involvemint/client/shared/util';
import { calculatePoiStatus, calculatePoiTimeWorked, PoiStatus } from '@involvemint/shared/domain';
import { parseDate } from '@involvemint/shared/util';
import { IonButton, IonInfiniteScroll, IonSlides } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { ModalCommentComponent } from './comments/modal-comments.component';
import { compareDesc } from 'date-fns';
import { tap } from 'rxjs/operators';
import { CommentStoreModel, commentsAdapter } from 'libs/client/shared/data-access/src/lib/+state/comments/comments.reducer';

interface State {
  posts: Array<PostStoreModel & { status: PoiStatus; timeWorked: string; }>;
  loaded: boolean;
  onlyPostsWithFlaggedComments: boolean;
}

@Component({
  selector: 'involvemint-moderation',
  templateUrl: './moderation.component.html',
  styleUrls: ['./moderation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModerationComponent extends StatefulComponent<State> implements OnInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;
  @ViewChild('likeButton', { read: IonButton }) likeButton!: IonButton;
  @ViewChild('unlikeButton', { read: IonButton }) unlikeButton!: IonButton;
  @ViewChild('slides', { read: IonSlides }) slides!: IonSlides;
  loading = false;
  event: any = null;
  allPagesLoaded = false;

  get PoiStatus() {
    return PoiStatus;
  }

  constructor(
    private readonly user: UserFacade,
    private modalCtrl: ModalController,
    private readonly viewProfileModal: ImViewProfileModalService,
    private readonly chat: ChatService
    ) {
    super({ posts: [], loaded: false, onlyPostsWithFlaggedComments: false });
  }

  ngOnInit(): void {

    this.effect(() => 
      this.user.posts.selectors.posts$.pipe(
        tap(({ posts, loaded, allPagesLoaded }) => {
          this.completeLoad(allPagesLoaded); 
          this.updateState({
            posts: posts
              .sort((a, b) => 
                compareDesc(parseDate(a.dateCreated ?? new Date()), parseDate(b.dateCreated ?? new Date()))
              )
              .map((post) => ({
                ...post,
                status: calculatePoiStatus(post.poi),
                timeWorked: calculatePoiTimeWorked(post.poi)
              })),
            loaded: loaded
          })
        })
      )
    );

  }

  /** Used on updates to state data to check if infiniteScroll reached end */
  completeLoad(allPagesLoaded: boolean): void {
    this.allPagesLoaded = allPagesLoaded;
    if (this.loading && this.event) {
      this.event.target.complete();
      this.loading = false;
    }
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = allPagesLoaded;
    }
  }

  /** Used by infiniteScroll to issue request to load more posts */
  loadMore(event: Event) {
    if (!this.allPagesLoaded) {
      this.user.posts.dispatchers.loadPosts();
      this.loading = true;
      this.event = event;
    }
  }

  /**
     * Dispatches a 'like' request for a post using NgRx state management.
     * The changes resulting from the request can be tracked/re-rendered using post selectors.
  */
  like(id: string) {
    if (!this.likeButton.disabled) {
        this.likeButton.disabled = true; // prevent click spam
        this.user.posts.dispatchers.like({
            postId: id,
        });
    }
  }

  /**
     * Dispatches a 'unlike' request for a post using NgRx state management.
     * The changes resulting from the request can be tracked/re-rendered using post selectors.
  */
  unlike(id: string) {
    if (!this.unlikeButton.disabled) {
        this.unlikeButton.disabled = true; // prevent click spam
        this.user.posts.dispatchers.unlike({
            postId: id,
        });
    }
  }

  message(handle: string) {
      this.chat.upsert([{ handleId: handle }]);
  }

  /** Used to check which like button to display */
  checkUserLiked(post: PostStoreModel) {
    let userId = "";
    this.user.session.selectors.email$.subscribe(s => userId = s);
    const filteredObj = post.likes.filter(obj => obj.user.id === userId);
    return filteredObj.length != 0
  }

   /** Used to track posts and prevent excessive re-rendering */
  trackPost(_index: number, post: PostStoreModel) {
    return post.id;
  }

  /**
     * Opens the comment modal (modal-comments.component.ts) and waits.
  */
  async viewComments(post: PostStoreModel) {
    const modal = await this.modalCtrl.create({
      component: ModalCommentComponent,
      componentProps: {
        'post': post,
        'user': this.user,
     }
    });
    modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.updatePostComments(post.id, data);
    }

  }

  /**
     * Updates state of comments within post given by postId (necessary for changes
     * to be saved after modal is closed)
  */
  private updatePostComments(postId: string, updatedComments: Array<CommentStoreModel>) {
    this.updateState((state => {
      const updatedPosts = state.posts.map((post) => {
        if (post.id === postId) {
          return { ...post, comments: updatedComments };
        }
        return post;
      });
      return { ...state, posts: updatedPosts };
    })(this.state));
  }

  /**
     * Called when admin toggles between all posts and only posts with flagged comments
  */
  updatePostsDisplayed() {
    this.updateState({ onlyPostsWithFlaggedComments: !this.state.onlyPostsWithFlaggedComments });
    // Only show posts with flagged comments
    if (this.state.onlyPostsWithFlaggedComments) {
      this.updateState((state => {
        const updatedPosts = state.posts.filter(post => 
          post.comments.filter(comment => comment.flagCount > 0).length > 0);
        return { ...state, posts: updatedPosts };
      })(this.state));
    } else {
      const flaggedState = this.state;
      this.ngOnInit();
      // Need this to update state of comments when toggling back to displaying all posts
      this.updateState((state => {
        var updatedPosts = this.state.posts; 
        for (let i = 0; i < flaggedState.posts.length; i++) {
          const flaggedPost = flaggedState.posts[i];
          updatedPosts = updatedPosts.map((post) => {
            if (post.id === flaggedPost.id) {
              return { ...post, comments: flaggedPost.comments };
            }
            return post;
          });
        }
        return { ...state, posts: updatedPosts };
      })(this.state))
    }
  }

  /** Functions to compute/provide UI values */
  getUserAvatar(post: PostStoreModel) {
    return post.user.changeMaker?.profilePicFilePath
  }

  getUserFirstName(post: PostStoreModel) {
    return post.user.changeMaker?.firstName
  }

  getUserLastName(post: PostStoreModel) {
    return post.user.changeMaker?.lastName
  }

  calculateTimeWorked(poi: any) {
    let tempString = calculatePoiTimeWorked(poi);
    tempString = tempString.replace("seconds", "sec");
    tempString = tempString.replace("minutes", "min");
    tempString = tempString.replace("hours", "hrs");
    return tempString;
  }

  // Convert user handle to string in order to pass into profile viewer
  getUserHandle(post: PostStoreModel) {
    if (post.user.changeMaker?.handle.id != undefined) {
      return post.user.changeMaker?.handle.id
    } else {
      return ""
    }
  }

  viewProfile(handle: string) {
    this.viewProfileModal.open({ handle });
  }
}
