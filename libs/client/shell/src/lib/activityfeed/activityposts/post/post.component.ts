import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { ImViewProfileModalService, PostStoreModel, UserFacade } from "@involvemint/client/shared/data-access";
import { PoiStatus, calculatePoiStatus, calculatePoiTimeWorked } from "@involvemint/shared/domain";
import { IonButton, ModalController } from "@ionic/angular";
import { ModalCommentComponent } from "../comments/modal-comments.component";

/**
 * Activity Post Component.
 * 
 * The component responsible for the rendering of actual Activity Posts to users and providing
 * like/unlike and comment functionality. The post to be rendered needs to be passed to the 
 * component via a 'post' input value. It is NOT a stateful component and it needs to be used 
 * within other stateful components that can track and re-render the component when necessary 
 * (see activityposts.component.ts/html for example). 
 */
export const CLOSED = "close";

@Component({
    selector: 'app-post',
    templateUrl: './post.component.html',
    styleUrls: ['./post.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostComponent implements OnInit {
    @Input() post!: PostStoreModel;
    constructor(
        private readonly user: UserFacade,
        private readonly viewCommentsModal: ModalController,
        private readonly viewProfileModal: ImViewProfileModalService,
    ) { } 

    ngOnInit(): void { }

    /**
     * Dispatches a 'like' request for a post using NgRx state management.
     * The changes resulting from the request can be tracked/re-rendered using post selectors.
     */
    like(id: string, button: IonButton) {
        button.disabled = true; // prevent click spam
        this.user.posts.dispatchers.like({
            postId: id,
        })
    }

    /**
     * Dispatches a 'unlike' request for a post using NgRx state management.
     * The changes resulting from the request can be tracked/re-rendered using post selectors.
     */
    unlike(id: string, button: IonButton) {
        button.disabled = true; // prevent click spam
        this.user.posts.dispatchers.unlike({
            postId: id,
        })
    }

    /** Used to check which like button to display */
    checkUserLiked(post: PostStoreModel) {
        let userId = "";
        this.user.session.selectors.email$.subscribe(s => userId = s);
        const filteredObj = post.likes.filter(obj => obj.user.id === userId);
        return filteredObj.length != 0
    }

    /** Functions to compute/provide UI values */
    calculatePoiStatus(poi: any) {
        return calculatePoiStatus(poi);
    }
    calculateTimeWorked(poi: any) {
        return calculatePoiTimeWorked(poi);
    }
    get PoiStatus() {
        return PoiStatus;
    }

    /** Functions to get user values */
    getUserAvatar(post: PostStoreModel) {
        return post.user.changeMaker?.profilePicFilePath
      }
    getUserFirstName(post: PostStoreModel) {
        return post.user.changeMaker?.firstName
    }
    getUserLastName(post: PostStoreModel) {
        return post.user.changeMaker?.lastName
    }
    getUserHandle(post: PostStoreModel) {
        if (post.user.changeMaker?.handle.id != undefined) {
          return post.user.changeMaker?.handle.id
        } else {
          return ""
        }
    }

    /**
     * Opens the CM profile modal.
     */
    viewProfile(handle: string) {
        this.viewProfileModal.open({ handle });
    }

    /**
     * Opens the comment modal (modal-comments.component.ts) and waits.
     */
    async viewComments(post: PostStoreModel) {
        const modal = await this.viewCommentsModal.create({
            component: ModalCommentComponent,
            componentProps: {
            'post': post,
            'user': this.user,
            }
        });
        modal.present();
        
        const { data } = await modal.onWillDismiss();
        post.comments = data;
    }
}
