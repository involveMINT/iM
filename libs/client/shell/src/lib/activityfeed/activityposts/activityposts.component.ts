import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  ChangeMakerFacade,
  EnrollmentsModalService,
  PoiCmStoreModel,
} from '@involvemint/client/cm/data-access';
import { UserFacade, PostStoreModel } from '@involvemint/client/shared/data-access';
import { RouteService } from '@involvemint/client/shared/routes';
import { StatefulComponent } from '@involvemint/client/shared/util';
import { calculatePoiStatus, calculatePoiTimeWorked, PoiStatus } from '@involvemint/shared/domain';
import { parseDate } from '@involvemint/shared/util';
import { IonButton } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { ModalCommentComponent } from './comments/modal-comments.component';
import { compareDesc } from 'date-fns';
import { merge } from 'rxjs';
import { take, tap } from 'rxjs/operators';


interface State {
  posts: Array<PostStoreModel & { status: PoiStatus; timeWorked: string; }>;
  loaded: boolean;
}

@Component({
  selector: 'involvemint-activityposts',
  templateUrl: './activityposts.component.html',
  styleUrls: ['./activityposts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeedComponent extends StatefulComponent<State> implements OnInit {

  get PoiStatus() {
    return PoiStatus;
  }

  constructor(
    private readonly cf: ChangeMakerFacade,
    private readonly route: RouteService,
    private readonly enrollmentsModal: EnrollmentsModalService,
    private readonly user: UserFacade,
    private modalCtrl: ModalController
    
  ) {
    super({ posts: [], loaded: false });
  }

  ngOnInit(): void {

    this.effect(() => 
      this.user.posts.selectors.posts$.pipe(
        tap(({ posts, loaded }) => 
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
        )
      )
    );

  }

  refresh() {
    this.cf.poi.dispatchers.refresh();
  }

  calculatePoiStatus(poi: PoiCmStoreModel) {
    return calculatePoiStatus(poi);
  }

  loadMore(event: Event) {
    this.cf.poi.dispatchers.loadMore();
    merge(this.cf.poi.actionListeners.loadPois.success, this.cf.poi.actionListeners.loadPois.error)
      .pipe(take(1))
      .subscribe(() => (event.target as any).complete());
  }

  like(id: string, button: IonButton) {
    button.disabled = true; // prevent click spam
    this.user.posts.dispatchers.like({
      postId: id,
    })
  }

  unlike(id: string, button: IonButton) {
    button.disabled = true; // prevent click spam
    this.user.posts.dispatchers.unlike({
      postId: id,
    })
  }

  checkUserLiked(post: PostStoreModel) {
    let userId = "";
    this.user.session.selectors.email$.subscribe(s => userId = s);
    const filteredObj = post.likes.filter(obj => obj.user.id === userId);
    return filteredObj.length != 0
  }

  trackPost(index: number, post: PostStoreModel) {
    return post.id;
  }

  async openModal(post: PostStoreModel) {
    const modal = await this.modalCtrl.create({
      component: ModalCommentComponent,
      componentProps: {
        'post': post,
        'user': this.user,
     }
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();

  }
}
