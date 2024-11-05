import * as PostsActions from './activity-posts.actions';

describe('Activity-Post Actions', () => {

    it('load posts', () => {
        const action = PostsActions.loadPosts({ page: 1, limit: 10 })
        expect(action.type).toEqual(PostsActions.LOAD_POSTS);
        expect(action.page).toEqual(1);
        expect(action.limit).toEqual(10);
    });

    it('load posts success', () => {
        const action = PostsActions.loadPostsSuccess({ posts: [{ id: 5 } as any], page: 2, limit: 10 });
        expect(action.type).toEqual(PostsActions.LOAD_POSTS_SUCCESS);
        expect(action.page).toEqual(2);
        expect(action.posts).toEqual([{ id: 5 }])
        expect(action.limit).toEqual(10);
    });

    it('load post error', () => {
        const action = PostsActions.loadPostsError({ error: {
            statusCode: 24,
            timestamp: "123",
            operation: "Activity Posts Load",
            message: "Server Failure",
            response: ""
        }});
        expect(action.type).toEqual(PostsActions.LOAD_POSTS_ERROR);
        expect(action.error).toEqual({
            statusCode: 24,
            timestamp: "123",
            operation: "Activity Posts Load",
            message: "Server Failure",
            response: ""
        });
    });

    it('get post', () => {
        const action = PostsActions.getPost({ dto: { postId: "1"}});
        expect(action.type).toEqual(PostsActions.GET_POST);
        expect(action.dto).toEqual({ postId: "1" });
    });

    it('get post success', () => {
        const action = PostsActions.getPostSuccess({
            post: { id: "1" } as any
        });
        expect(action.type).toEqual(PostsActions.GET_POST_SUCCESS);
        expect(action.post).toEqual({
            id: "1"
        });
    });

    it('get post error', () => {
        const action = PostsActions.getPostError({
            error: {
                statusCode: 24,
                timestamp: "123",
                operation: "Get Post",
                message: "Server Failure",
                response: ""
            }
        });
        expect(action.type).toEqual(PostsActions.GET_POST_ERROR);
        expect(action.error).toEqual({
            statusCode: 24,
            timestamp: "123",
            operation: "Get Post",
            message: "Server Failure",
            response: ""
        });
    });

    it('create post', () => {
        const action = PostsActions.createPost({ dto: {
            poiId: "3"
        }});
        expect(action.type).toEqual(PostsActions.CREATE_POST);
        expect(action.dto).toEqual({ poiId: "3" });
    });

    it('create post success', () => {
        const action = PostsActions.createPostSuccess({
            post: { id: "1" } as any
        });
        expect(action.type).toEqual(PostsActions.CREATE_POST_SUCCESS);
        expect(action.post).toEqual({
            id: "1"
        });
    });

    it('create post error', () => {
        const action = PostsActions.createPostError({
            error: {
                statusCode: 24,
                timestamp: "123",
                operation: "Create Post",
                message: "Server Failure",
                response: ""
            }
        });
        expect(action.type).toEqual(PostsActions.CREATE_POST_ERROR);
        expect(action.error).toEqual({
            statusCode: 24,
            timestamp: "123",
            operation: "Create Post",
            message: "Server Failure",
            response: ""
        });
    });

    it('like post', () => {
        const action = PostsActions.like({
            dto: {
                postId: "1"
            }
        })
        expect(action.type).toEqual(PostsActions.LIKE_POST);
        expect(action.dto).toEqual({
            postId: "1"
        });
    });

    it('like post success', () => {
        const action = PostsActions.likeSuccess({
            post: { id: "1", likeCount: 2 } as any
        });
        expect(action.type).toEqual(PostsActions.LIKE_POST_SUCCESS);
        expect(action.post).toEqual({
            id: "1",
            likeCount: 2
        });
    });

    it('like post error', () => {
        const action = PostsActions.likeError({
            error: {
                statusCode: 24,
                timestamp: "now",
                operation: "Like Post",
                message: "Server Failure",
                response: ""
            }
        });
        expect(action.type).toEqual(PostsActions.LIKE_POST_ERROR);
        expect(action.error).toEqual({
            statusCode: 24,
            timestamp: "now",
            operation: "Like Post",
            message: "Server Failure",
            response: ""
        });
    });

    it('unlike post', () => {
        const action = PostsActions.unlike({
            dto: {
                postId: "1"
            }
        });
        expect(action.type).toEqual(PostsActions.UNLIKE_POST);
        expect(action.dto).toEqual({
            postId: "1"
        });
    });

    it('unlike post success', () => {
        const action = PostsActions.unlikeSuccess({
            post: {
                id: "1",
                likeCount: 1
            } as any
        });
        expect(action.type).toEqual(PostsActions.UNLIKE_POST_SUCCESS);
        expect(action.post).toEqual({
            id: "1",
            likeCount: 1
        });
    });

    it('unlike post error', () => {
        const action = PostsActions.unlikeError({
            error: {
                statusCode: 24,
                timestamp: "123",
                operation: "Unlike Post",
                message: "Server Failure",
                response: ""
            }
        });
        expect(action.type).toEqual(PostsActions.UNLIKE_POST_ERROR);
        expect(action.error).toEqual({
            statusCode: 24,
            timestamp: "123",
            operation: "Unlike Post",
            message: "Server Failure",
            response: ""
        });
    });

});
