import { initialState, postsAdapter, PostsReducer } from "./activity-posts.reducer";
import * as PostsActions from './activity-posts.actions';


describe('Activity-Post Reducer', () => {

    beforeEach(() => {

        // reset the state to init
        initialState.pagesLoaded = 0;
        initialState.posts = {
            entities: {},
            ids: [],
        };
        initialState.allPagesLoaded = false;

        // spy methods used
        jest.spyOn(postsAdapter, 'upsertMany')
            .mockImplementation((posts: any, existing: any) => {
                posts.forEach((post: any) => {
                    existing.ids.push(post.id);
                });
                return existing;
            });

        jest.spyOn(postsAdapter, 'upsertOne')
            .mockImplementation((post: any, existing: any) => {
                existing.ids.push(post.id);
                return existing;
            });
    });

    afterEach(() => { jest.clearAllMocks(); })

    it('should return initial state when undefined start', () => {
        const newState = PostsReducer(undefined, PostsActions.loadPosts);
        expect(newState).toEqual(initialState);
    });

    it('should return initial state when undefined start & action', () => {
        const newState = PostsReducer(undefined, { type: 'NOOP' } as any);
        expect(newState).toEqual(initialState);
    });

    it('should return initial state on unknown action', () => {
        const newState = PostsReducer(initialState, { type: 'NOOP' } as any);
        expect(newState).toEqual(initialState);
    });

    it('should return initial state on unregistered action', () => {
        const newState = PostsReducer(
            initialState, 
            PostsActions.like({ dto: { postId: "1"}})
        );
        expect(newState).toEqual(initialState);
    });

    it('should update posts & page on load posts success w/ pagination not complete', () => {
        const action = PostsActions.loadPostsSuccess({ 
            posts: [{ id: 1 }, { id: 2 },{ id: 3 },{ id: 4 },{ id: 5 },{ id: 6 },{ id: 7 },{ id: 8 },{ id: 9 },{ id: 10 }], 
            page: 1,
            limit: initialState.limit,
        } as any);
        const newState = PostsReducer(initialState, action);
        expect(postsAdapter.upsertMany).toBeCalledTimes(1);
        expect(newState.posts.ids.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort());
        expect(newState.posts.entities).toEqual({});
        expect(newState.pagesLoaded).toEqual(1);
        expect(newState.allPagesLoaded).toEqual(false);
    });

    it('should update posts & page on load posts success w/ pagination complete returning partial', () => {
        const action = PostsActions.loadPostsSuccess({ 
            posts: [{ id: 1 }, { id: 2 }, { id: 3 }], 
            page: 1,
            limit: initialState.limit,
        } as any);
        const newState = PostsReducer(initialState, action);
        expect(postsAdapter.upsertMany).toBeCalledTimes(1);
        expect(newState.posts.ids.sort()).toEqual([1, 2, 3].sort());
        expect(newState.posts.entities).toEqual({});
        expect(newState.pagesLoaded).toEqual(1);
        expect(newState.allPagesLoaded).toEqual(true);
    });

    it('should update posts & page on load posts success w/ pagination complete returning empty', () => {
        const action = PostsActions.loadPostsSuccess({ 
            posts: [], 
            page: 1,
            limit: initialState.limit,
        } as any);
        const newState = PostsReducer(initialState, action);
        expect(postsAdapter.upsertMany).toBeCalledTimes(1);
        expect(newState.posts.ids).toEqual([].sort());
        expect(newState.posts.entities).toEqual({});
        expect(newState.pagesLoaded).toEqual(1);
        expect(newState.allPagesLoaded).toEqual(true);
    });

    it('should add post on get post success', () => {
        const action = PostsActions.getPostSuccess({ post: { id: 1 }} as any);
        const newState = PostsReducer(initialState, action);
        expect(postsAdapter.upsertOne).toBeCalledTimes(1);
        expect(newState).toEqual({
            posts: {
                entities: {},
                ids: [ 1 ]
            },
            pagesLoaded: 0,
            allPagesLoaded: false,
            limit: 10,
        });
    });

    it('should add post on create post success', () => {
        const action = PostsActions.createPostSuccess({ post: { id: 1 } as any });
        const newState = PostsReducer(initialState, action);
        expect(postsAdapter.upsertOne).toBeCalledTimes(1);
        expect(newState).toEqual({
            posts: {
                entities: {},
                ids: [ 1 ]
            },
            pagesLoaded: 0,
            allPagesLoaded: false,
            limit: 10,
        });
    });

    it('should update post on like post success', () => {
        const action = PostsActions.likeSuccess({ post: { id: 1 } as any});
        const newState = PostsReducer(initialState, action);
        expect(postsAdapter.upsertOne).toBeCalledTimes(1);
        expect(newState).toEqual({
            posts: {
                entities: {},
                ids: [ 1 ]
            },
            pagesLoaded: 0,
            allPagesLoaded: false,
            limit: 10,
        });
    });

    it('should update post on unlike post success', () => {
        const action = PostsActions.unlikeSuccess({ post: { id: 1 } as any});
        const newState = PostsReducer(initialState, action);
        expect(postsAdapter.upsertOne).toBeCalledTimes(1);
        expect(newState).toEqual({
            posts: {
                entities: {},
                ids: [ 1 ]
            },
            pagesLoaded: 0,
            allPagesLoaded: false,
            limit: 10,
        });
    });

})