import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { ChangeMakerFacade } from '@involvemint/client/cm/data-access';
import { UserFacade, PostStoreModel, ActivityPostOrchestration } from '@involvemint/client/shared/data-access';
import { StatefulComponent } from '@involvemint/client/shared/util';
import { ActivityPostQuery, PoiStatus } from '@involvemint/shared/domain';
import { parseDate } from '@involvemint/shared/util';
import { IonInfiniteScroll } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { compareDesc } from 'date-fns';
import { tap } from 'rxjs/operators';
import { CLOSED, ModalDigestComponent } from './modal-digest/modal-digest.component';


/**
 * Defining a 'State' interface for an Angular component and extending the
 * 'StatefulComponent' allows the component to know what the state being tracked
 * is and dynamically update/re-render the component when the state is updated.
 * 
 * Activity Posts Component state tracks the currently loaded Activity Posts,
 * the digest posts (notifications), and if the state has been loaded.
 */
interface State {
  posts: Array<PostStoreModel>;
  digestPosts: Array<PostStoreModel>;
  loaded: boolean;
}

/**
 * Activity Posts Component.
 * 
 * The primary component which works in conjunction with activityposts.component.html to 
 * provide the Activity Post Feed view. It is a stateful component (see state interface above), 
 * which tracks the Activity Posts loaded in the state manager using the posts$ selector
 * view. It provides infiniteScrolling ability to users that will continuously fetch and display
 * more posts as users scroll down until. This component handles mostly tracking/re-rending of post 
 * data and user requests, the rendering of individual posts data is handled mostly by post.component. 
 */
@Component({
  selector: 'involvemint-activityposts',
  templateUrl: './activityposts.component.html',
  styleUrls: ['./activityposts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeedComponent extends StatefulComponent<State> implements OnInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;
  loading = false;
  allPagesLoaded = false;
  event: any = null;

  get PoiStatus() {
    return PoiStatus;
  }

  constructor(
    private readonly post: ActivityPostOrchestration,
    private readonly user: UserFacade,
    private readonly viewDigestModal: ModalController,
  ) {
    super({ posts: [], digestPosts: [], loaded: false });
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
                ...post
              })),
            loaded: loaded
          });
        })
      )
    );

    /**
     * Register a new effect which loads the notifications for a user in the background.
     * Add values to the state.
     * This tests if it will work at all.
     */
    this.user.session.selectors.state$.subscribe(
      session => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const lastLoggedIn = session.dateLastLoggedIn ? new Date(session.dateLastLoggedIn) : weekAgo;
        const startDate = (lastLoggedIn > weekAgo ? lastLoggedIn : weekAgo).toISOString();
        this.post.digest(ActivityPostQuery, { startDate }).subscribe(
          posts => {
            this.updateState({
              digestPosts: posts
            })
          }
        )
      }
    )

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
    } else {
      this.event = event;
      this.event.target.complete();
    }
  }

  /** Used to track posts and prevent excessive re-rendering */
  trackPost(_index: number, post: PostStoreModel) {
    return post.id;
  }

  /**
   * Opens the notification digest modal (modal-digest.component.ts) and waits. 
   * Updates the digest posts based on posts returned from modal.
   */
  async viewDigest() {
    const modal = await this.viewDigestModal.create({
      component: ModalDigestComponent,
      componentProps: {
        'digestPosts': this.state.digestPosts
      }
    });
  
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
  
    if (role === CLOSED) {
      this.updateState({
        digestPosts: data
      });
    }
  }
}
