import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { PostStoreModel, UserFacade } from "@involvemint/client/shared/data-access";
import { StatefulComponent } from "@involvemint/client/shared/util";
import { ModalController } from "@ionic/angular";
import { tap } from 'rxjs/operators';
import { CLOSED } from "../post/post.component";


/**
 * Activity Post Modal state tracks the Activity Post that it is 
 * supposed to be rendering to the user.
 */
interface State {
    post?: PostStoreModel;
}

/**
 * Activity Post Modal Component.
 * 
 * The component responsible for tracking and rendering a modal to view a single
 * Activity Post. Currently, it is used to view a Post attached to a notification.
 * The component tracks the Activity Post using the 'getPost(...)' selector view
 * and renders the Activity Post within the component using activitypost.component.
 * The modal also requires a 'post' input which it uses to decipher which post
 * to track.
 */
@Component({
    selector: 'app-modal-post',
    templateUrl: './modal-post.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalPostComponent extends StatefulComponent<State> implements OnInit {
    @Input() post!: PostStoreModel;
    constructor(
        private readonly modalCtrl: ModalController,
        private readonly user: UserFacade,
    ) { 
        super({
            post: undefined
        });
    }

    ngOnInit(): void {
        this.effect(() =>
            this.user.posts.selectors.getPost(this.post.id).pipe(
                tap(({ post }) => 
                    this.updateState({
                        post: post 
                    })
                )
            )
        );
    }

    close() {
        return this.modalCtrl.dismiss(null, CLOSED);
    }

}