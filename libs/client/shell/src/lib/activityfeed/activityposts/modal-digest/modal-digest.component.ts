import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { PostStoreModel, UserFacade } from "@involvemint/client/shared/data-access";
import { ModalController } from "@ionic/angular";
import { ModalPostComponent } from "../modal-post/modal-post.component";


export const CLOSED = "close";
export const OPEN = "open";
const imagePlaceholder 
        = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Image_not_available.png/640px-Image_not_available.png";

/**
 * Digest Modal Component.
 * 
 * The component responsible for rendering a modal to view the Activity Feed
 * notification digest for a user. The modal requires a 'digestPosts' input 
 * which is a list of the posts with recent activity to generate digest
 * notifications from. The digest modal also provides the ability to click
 * on a notification which will fetch and display the corresponding post.
 */
@Component({
    selector: 'app-modal-digest',
    templateUrl: './modal-digest.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalDigestComponent implements OnInit {
    @Input() digestPosts!: Array<PostStoreModel>;
    constructor(
        private readonly modalCtrl: ModalController,
        private readonly user: UserFacade
    ) { }

    ngOnInit(): void { }

    selectPostImage(imageFilePaths: string[]) {
        if (imageFilePaths.length === 0) {
            return [imagePlaceholder];
        }
        return imageFilePaths;
    }

    /** 
     * Opens a post modal to display individual post. First, fetches
     * the post into state management. Second, updates the digestPosts
     * list. Third, creates and displays the modal + passes post to it.
     */
    async openPost(post: PostStoreModel) {
        this.user.posts.dispatchers.get({ postId: post.id });
        this.digestPosts = this.digestPosts.filter(p => {
            return p.id !== post.id
        });
        const modal = await this.modalCtrl.create({
            component: ModalPostComponent,
            componentProps: { post: post },
          });
        await modal.present();
        return (await modal.onDidDismiss()).data;
    }

    close() {
        return this.modalCtrl.dismiss(this.digestPosts, CLOSED);
    }

    convertDate(date: Date | string) {
        if (typeof date == "string") {
            return new Date(date).toLocaleDateString();
        }
        return date.toLocaleDateString();
    }

}