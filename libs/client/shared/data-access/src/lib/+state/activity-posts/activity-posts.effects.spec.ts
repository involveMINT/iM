import { StatusService } from "@involvemint/client/shared/util";
import { asyncScheduler, Observable, of, throwError } from "rxjs";
import { ActivityPostOrchestration } from "../../orchestrations";
import { PostEffects } from "./activity-posts.effects";
import { Action } from "@ngrx/store";
import { provideMockActions } from '@ngrx/effects/testing';
import { TestBed } from "@angular/core/testing";
import { hot, cold } from 'jest-marbles';

import * as PostsActions from './activity-posts.actions';


describe('Activity-Post Effects', () => {

    let actions: Observable<Action>;
    let effects: PostEffects;
    let status: StatusService;
    let posts: ActivityPostOrchestration;
    
    beforeEach(() => {
        const moduleRef = TestBed.configureTestingModule({
            providers: [
                PostEffects,
                provideMockActions(() => actions),
                {
                    provide: StatusService,
                    useValue: {
                        showLoader: jest.fn(),
                        dismissLoader: jest.fn(),
                        presentNgRxActionAlert: jest.fn(),
                    }
                },
                {
                    provide: ActivityPostOrchestration,
                    useValue: {
                        list: jest.fn(),
                        create: jest.fn(),
                        like: jest.fn(),
                        unlike: jest.fn(),
                        get: jest.fn(),
                    }
                }
            ]
        });

        effects = moduleRef.get(PostEffects);

        status = moduleRef.get(StatusService);
        posts = moduleRef.get(ActivityPostOrchestration);

        // mock generic functions for all tests
        jest.spyOn(status, 'presentNgRxActionAlert')
            .mockImplementation(async (_action: any, error: any) => {
                return;
            });
        jest.spyOn(status, 'showLoader')
            .mockImplementation(async () => { return });
        jest.spyOn(status, 'dismissLoader')
            .mockImplementation(async () => { return });
    });

    it('should be defined', () => {
        expect(effects).toBeTruthy();
        expect(status).toBeTruthy();
        expect(posts).toBeTruthy();
    });

    it('should return load posts success on happy path', () => {
        // provide fake data that will be used in effect
        const fakePosts = {
            items: [
                { id: "1"} as any, {id: "2"} as any
            ]
        }
        
        const action = PostsActions.loadPosts({ page: 1, limit: 10 });
        const completion = PostsActions.loadPostsSuccess({ 
            posts: fakePosts.items, 
            page: 1,
            limit: 10,
        });

        // mock `this.posts.list` call and return OBSERVABLE data!
        jest.spyOn(posts, 'list')
            .mockImplementation((_query: any) => {
                return of(fakePosts)
            });

        // mock the observable action passed to effects
        actions = hot('--a-', { a: action });

        // specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.loadPosts$).toBeObservable(expected);
    });

    it('should return load posts error on unhappy path', () => {
        // provide fake data that will be used in effect
        const action = PostsActions.loadPosts({ page: 1, limit: 10 });
        const completion = PostsActions.loadPostsError({ error: undefined as any });

        // mock `this.posts.list` call and return OBSERVABLE data!
        jest.spyOn(posts, 'list')
            .mockImplementation((_query: any) => {
                throw throwError("error");
            });

        // mock the observable action passed to effects
        actions = hot('--a-', { a: action });

        // specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.loadPosts$).toBeObservable(expected);
    });

    it('should return get post success on happy path', () => {
        const fakePost = { id: "1" } as any;
        const action = PostsActions.getPost({ dto: { postId: "1" }});
        const completion = PostsActions.getPostSuccess({ post: fakePost });

        jest.spyOn(posts, 'get')
            .mockImplementation((_query: any, _dto: any) => {
                return of(fakePost);
            });
        
        actions = hot('--a-', { a: action });

        const expected = cold('--(b)', { b: completion });
        expect(effects.getPost$).toBeObservable(expected);
    });

    it('should return get post error on unhappy path', () => {
        const action = PostsActions.getPost({ dto: { postId: "1" }});
        const completion = PostsActions.getPostError({ error: undefined as any });

        jest.spyOn(posts, 'get')
            .mockImplementation((_query: any, _dto: any) => {
                throw throwError("error");
            });
        
        actions = hot('--a-', { a: action });

        const expected = cold('--(b)', { b: completion });
        expect(effects.getPost$).toBeObservable(expected);
    });

    it('should return like post success on happy path', () => {
        // provide fake data that will be used in effect
        const fakePost = { id: "1" } as any
        const action = PostsActions.like({ dto: { postId: "1" }});
        const completion = PostsActions.likeSuccess({ post: fakePost })

        // mock `this.posts.list` call and return OBSERVABLE data!
        jest.spyOn(posts, 'like')
            .mockImplementation((_query: any, _dto: any) => {
                return of(fakePost);
            });

        // specify expected output and run test
        actions = hot('--a-', { a: action });
        
        // specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.likePost$).toBeObservable(expected);
    });

    it('should return like post error on unhappy path', () => {
        const action = PostsActions.like({ dto: { postId: "1" }});
        const completion = PostsActions.likeError({ error: undefined as any });

        jest.spyOn(posts, 'like')
            .mockImplementation((_query: any, _dto: any) => {
                throw throwError("error");
            });

        // specify expected output and run test
        actions = hot('--a-', { a: action });
        
        // specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.likePost$).toBeObservable(expected);
    });

    it('should return unlike post success on happy path', () => {
        // provide fake data that will be used in effect
        const fakePost = { id: "1" } as any
        const action = PostsActions.unlike({ dto: { postId: "1" }});
        const completion = PostsActions.unlikeSuccess({ post: fakePost })

        // mock `this.posts.list` call and return OBSERVABLE data!
        jest.spyOn(posts, 'unlike')
            .mockImplementation((_query: any, _dto: any) => {
                return of(fakePost);
            });

        // specify expected output and run test
        actions = hot('--a-', { a: action });
        
        // specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.unlikePost$).toBeObservable(expected);
    });

    it('should return unlike post error on unhappy path', () => {
        const action = PostsActions.unlike({ dto: {postId: "1" }});
        const completion = PostsActions.unlikeError({ error: undefined as any });

        jest.spyOn(posts, 'unlike')
            .mockImplementation((_query: any, _dto: any) => {
                throw throwError("error");
            });

        // specify expected output and run test
        actions = hot('--a-', { a: action });
        
        // specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.unlikePost$).toBeObservable(expected);
    });

    // it('should return create post success on happy path', () => {
    //     // provide fake data that will be used in effect
    //     const fakePost = { id: "1"} as any;
    //     const action = PostsActions.createPost({ dto: { poiId: "21"}})
    //     const completion = PostsActions.createPostSuccess({
    //         post: fakePost
    //     });

    //     // mock `this.posts.list` call and return OBSERVABLE data!
    //     jest.spyOn(posts, 'create')
    //         .mockImplementation((_query: any, _dto: any) => {
    //             return of(fakePost);
    //         });

    //     actions = hot('--a-', { a: action });

    //     // specify expected output and run test
    //     const expected = cold('--(b)', { b: completion });
    //     const actual = effects.createPost$;
    //     expect(actual).toBeObservable(expected);
    // });

    // it('should return create post error on unhappy path', () => {
    //     const action = PostsActions.createPost({ dto: { poiId: "21"}})
    //     const completion = PostsActions.createPostError({ error: undefined as any });

    //     // mock `this.posts.list` call and return OBSERVABLE data!
    //     jest.spyOn(posts, 'create')
    //         .mockImplementation((_query: any, _dto: any) => {
    //             throw throwError("error");
    //         });

    //     actions = hot('--a-', { a: action });

    //     // specify expected output and run test
    //     const expected = cold('--(b)', { b: completion });
    //     const actual = effects.createPost$;
    //     expect(actual).toBeObservable(expected);
    // });

});