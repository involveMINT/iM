/**
 * This test suite is for the ModerationComponent using the ngneat/spectator testing framework.
 * The test suite includes a beforeEach() function that creates an instance of the ModerationComponent
 * using the createComponentFactory() method from ngneat/spectator. The createComponentFactory()
 * method creates a factory function that generates a ModerationComponent instance with the specified 
 * dependencies. The providers property is used to provide UserFacade service and other necessary services.
 * The it() function tests whether the component is created or not by checking the toBeTruthy() function.
 * The test suite also includes various test cases to ensure that component methods are working correctly.
 * Note that the describe() function is used to define the test suite for the ModerationComponent.

Note that the fdescribe() function is used to run only this test suite while excluding others.
 */
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { ModerationComponent } from './moderation.component';
import { IonicModule } from '@ionic/angular';
import { UserFacade, ImStorageUrlPipeModule, ImViewProfileModalService, PostStoreModel } from '@involvemint/client/shared/data-access';
import { FormsModule } from '@angular/forms';
import { ImBlockModule } from '@involvemint/client/shared/data-access';
import { StorageOrchestration } from '../../../../../shared/data-access/src/lib/orchestrations/storage.orchestration';

import { of } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';
import { CommentStoreModel } from 'libs/client/shared/data-access/src/lib/+state/comments/comments.reducer';

describe('Moderation Component', () => {
  let userFacade: UserFacade;
  let spectator: Spectator<ModerationComponent>;

  const createComponent = createComponentFactory({
    component: ModerationComponent,
    imports: [IonicModule.forRoot(), ImStorageUrlPipeModule, FormsModule, ImBlockModule],
    providers: [ImViewProfileModalService, StorageOrchestration],
    mocks: [
      UserFacade,
    ],
  });

  beforeEach(() => {
    userFacade = {
      posts: {
        selectors: {
          posts$: of({ posts: [], loaded: false, allPagesLoaded: false }),
        },
        dispatchers: {
          loadPosts: () => {},
          like: () => {},
          unlike: () => {},
        },
      },
      session: {
        selectors: {
          email$: of('test@test.com'),
        },
      },
    } as any;
    spectator = createComponent({
      providers: [{ provide: UserFacade, useValue: userFacade }],
    });
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should call loadMore method on scroll', () => {
    const loadMoreSpy = spyOn(spectator.component, 'loadMore');
    const event = new CustomEvent('test');
    spectator.component.loadMore(event);
    expect(loadMoreSpy).toHaveBeenCalled();
  });

  it('should call viewComments method', fakeAsync(() => {
    const viewCommentsSpy = spyOn(spectator.component, 'viewComments').and.callThrough();
    const post: PostStoreModel = {
      id: '1',
      user: {} as any,
      dateCreated: new Date(),
      likes: [],
      comments: [],
      poi: {} as any,
      likeCount: 0,
      enabled: false
    };
  
    spectator.component.viewComments(post);
    tick();
    expect(viewCommentsSpy).toHaveBeenCalled();
  }));

  it('should call updatePostsDisplayed method', () => {
    const updatePostsDisplayedSpy = spyOn(spectator.component, 'updatePostsDisplayed').and.callThrough();
    spectator.component.updatePostsDisplayed();
    expect(updatePostsDisplayedSpy).toHaveBeenCalled();
  });

  it('should call viewProfile method', () => {
    const viewProfileSpy = spyOn(spectator.component, 'viewProfile');
    const handle = 'test_handle';
    spectator.component.viewProfile(handle);
    expect(viewProfileSpy).toHaveBeenCalled();
  });

  it('should call trackPost method', () => {
    const trackPostSpy = spyOn(spectator.component, 'trackPost');
    const index = 1;
    const post: PostStoreModel = {
      id: '1',
      user: {} as any,
      dateCreated: new Date(),
      likes: [],
      comments: [],
      poi: {} as any,
      likeCount: 0,
      enabled: false
    };

    spectator.component.trackPost(index, post);
    expect(trackPostSpy).toHaveBeenCalled();
  });

  it('should call checkUserLiked method', () => {
    const checkUserLikedSpy = spyOn(spectator.component, 'checkUserLiked').and.callThrough();
    const post: PostStoreModel = {
      id: '1',
      user: {} as any,
      dateCreated: new Date(),
      likes: [],
      comments: [],
      poi: {} as any,
      likeCount: 0,
      enabled: false
    };
    spectator.component.checkUserLiked(post);
    expect(checkUserLikedSpy).toHaveBeenCalled();
  });
  
  it('should call getUserAvatar, getUserFirstName, getUserLastName, and getUserHandle methods', () => {
    const getUserAvatarSpy = spyOn(spectator.component, 'getUserAvatar').and.callThrough();
    const getUserFirstNameSpy = spyOn(spectator.component, 'getUserFirstName').and.callThrough();
    const getUserLastNameSpy = spyOn(spectator.component, 'getUserLastName').and.callThrough();
    const getUserHandleSpy = spyOn(spectator.component, 'getUserHandle').and.callThrough();

    const post: PostStoreModel = {
      id: '1',
      user: {
        changeMaker: {
          profilePicFilePath: 'path/to/profile/pic',
          firstName: 'John',
          lastName: 'Doe',
          handle: {
            id: 'john_doe',
          },
        },
      } as any,
      dateCreated: new Date(),
      likes: [],
      comments: [],
      poi: {} as any,
      likeCount: 0,
      enabled: false
    };

    spectator.component.getUserAvatar(post);
    spectator.component.getUserFirstName(post);
    spectator.component.getUserLastName(post);
    spectator.component.getUserHandle(post);

    expect(getUserAvatarSpy).toHaveBeenCalled();
    expect(getUserFirstNameSpy).toHaveBeenCalled();
    expect(getUserLastNameSpy).toHaveBeenCalled();
    expect(getUserHandleSpy).toHaveBeenCalled();
  });

  it('should call completeLoad method', () => {
    const completeLoadSpy = spyOn<any>(spectator.component, 'completeLoad').and.callThrough();
    const allPagesLoaded = true;

    spectator.component.completeLoad(allPagesLoaded);
    expect(completeLoadSpy).toHaveBeenCalled();
  });

  // Add more test cases as needed
});

