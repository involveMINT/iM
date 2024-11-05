import * as CommentsActions from './comments.actions';

describe('Comment Actions', () => {

    it('load comments', () => {
        const action = CommentsActions.loadComments({ page: 1 })
        expect(action.type).toEqual(CommentsActions.LOAD_COMMENTS);
        expect(action.page).toEqual(1);
    });

    it('load comments success', () => {
        const action = CommentsActions.loadCommentsSuccess({ comments: [{ id: 5 } as any], page: 2});
        expect(action.type).toEqual(CommentsActions.LOAD_COMMENTS_SUCCESS);
        expect(action.page).toEqual(2);
        expect(action.comments).toEqual([{ id: 5 }])
    });

    it('load comments error', () => {
        const action = CommentsActions.loadCommentsError({ error: {
            statusCode: 24,
            timestamp: "123",
            operation: "Comments Load",
            message: "Server Failure",
            response: ""
        }});
        expect(action.type).toEqual(CommentsActions.LOAD_COMMENTS_ERROR);
        expect(action.error).toEqual({
            statusCode: 24,
            timestamp: "123",
            operation: "Comments Load",
            message: "Server Failure",
            response: ""
        });
    });

    it('create comment', () => {
        const action = CommentsActions.createComment({ dto: {
            postId: "3",
            text: "test",
            commentsId: "4",
            handleId: "2",
            profilePicFilePath: "testing/123/picture",
            name: "john smith"
        }});
        expect(action.type).toEqual(CommentsActions.CREATE_COMMENT);
        expect(action.dto).toEqual({ 
            postId: "3",
            text: "test",
            commentsId: "4",
            handleId: "2",
            profilePicFilePath: "testing/123/picture",
            name: "john smith"
        });
    });

    it('create comment success', () => {
        const action = CommentsActions.createCommentSuccess({
            comment: { id: "1" } as any
        });
        expect(action.type).toEqual(CommentsActions.CREATE_COMMENT_SUCCESS);
        expect(action.comment).toEqual({
            id: "1"
        });
    });

    it('create comment error', () => {
        const action = CommentsActions.createCommentError({
            error: {
                statusCode: 24,
                timestamp: "123",
                operation: "Create Comment",
                message: "Server Failure",
                response: ""
            }
        });
        expect(action.type).toEqual(CommentsActions.CREATE_COMMENT_ERROR);
        expect(action.error).toEqual({
            statusCode: 24,
            timestamp: "123",
            operation: "Create Comment",
            message: "Server Failure",
            response: ""
        });
    });

    it('flag comment', () => {
        const action = CommentsActions.flagComment({ 
            dto: {
                commentId: "1",
            }
        })
        expect(action.type).toEqual(CommentsActions.FLAG_COMMENT);
        expect(action.dto).toEqual({
            commentId: "1",
        });
    });

    it('flag comment success', () => {
        const action = CommentsActions.flagCommentSuccess({
            comment: { id: "1" } as any
        });
        expect(action.type).toEqual(CommentsActions.FLAG_COMMENT_SUCCESS);
        expect(action.comment).toEqual({
            id: "1"
        });
    });

    it('flag comment error', () => {
        const action = CommentsActions.flagCommentError({
            error: {
                statusCode: 24,
                timestamp: "123",
                operation: "Flag Comment",
                message: "Server Failure",
                response: ""
            }
        });
        expect(action.type).toEqual(CommentsActions.FLAG_COMMENT_ERROR);
        expect(action.error).toEqual({
            statusCode: 24,
            timestamp: "123",
            operation: "Flag Comment",
            message: "Server Failure",
            response: ""
        });
    });

    it('init comments', () => {
        const action = CommentsActions.initComments({ comments: [{ id: 5 } as any] });
        expect(action.type).toEqual(CommentsActions.INIT_COMMENTS);
        expect(action.comments).toEqual([{ id: 5 }]);
    });

    it('unflag comment', () => {
        const action = CommentsActions.unflagComment({ 
            dto: {
                commentId: "1",
            }
        })
        expect(action.type).toEqual(CommentsActions.UNFLAG_COMMENT);
        expect(action.dto).toEqual({
            commentId: "1",
        });
    });

    it('unflag comment success', () => {
        const action = CommentsActions.unflagCommentSuccess({
            comment: { 
                id: "1",
                flagCount: 1
            } as any
        });
        expect(action.type).toEqual(CommentsActions.UNFLAG_COMMENT_SUCCESS);
        expect(action.comment).toEqual({
            id: "1",
            flagCount: 1
        });
    });

    it('unflag comment error', () => {
        const action = CommentsActions.unflagCommentError({
            error: {
                statusCode: 24,
                timestamp: "123",
                operation: "Unflag Comment",
                message: "Server Failure",
                response: ""
            }
        });
        expect(action.type).toEqual(CommentsActions.UNFLAG_COMMENT_ERROR);
        expect(action.error).toEqual({
            statusCode: 24,
            timestamp: "123",
            operation: "Unflag Comment",
            message: "Server Failure",
            response: ""
        });
    });

    it('hide comment', () => {
        const action = CommentsActions.hideComment({ 
            dto: {
                commentId: "1",
            }
        })
        expect(action.type).toEqual(CommentsActions.HIDE_COMMENT);
        expect(action.dto).toEqual({
            commentId: "1",
        });
    });

    it('hide comment success', () => {
        const action = CommentsActions.hideCommentSuccess({
            comment: { 
                id: "1",
                isHidden: true
            } as any
        });
        expect(action.type).toEqual(CommentsActions.HIDE_COMMENT_SUCCESS);
        expect(action.comment).toEqual({
            id: "1",
            isHidden: true
        });
    });

    it('hide comment error', () => {
        const action = CommentsActions.hideCommentError({
            error: {
                statusCode: 24,
                timestamp: "123",
                operation: "Hide Comment",
                message: "Server Failure",
                response: ""
            }
        });
        expect(action.type).toEqual(CommentsActions.HIDE_COMMENT_ERROR);
        expect(action.error).toEqual({
            statusCode: 24,
            timestamp: "123",
            operation: "Hide Comment",
            message: "Server Failure",
            response: ""
        });
    });

    it('unhide comment', () => {
        const action = CommentsActions.unhideComment({ 
            dto: {
                commentId: "1",
            }
        })
        expect(action.type).toEqual(CommentsActions.UNHIDE_COMMENT);
        expect(action.dto).toEqual({
            commentId: "1",
        });
    });

    it('unhide comment success', () => {
        const action = CommentsActions.unhideCommentSuccess({
            comment: { 
                id: "1",
                isHidden: false
            } as any
        });
        expect(action.type).toEqual(CommentsActions.UNHIDE_COMMENT_SUCCESS);
        expect(action.comment).toEqual({
            id: "1",
            isHidden: false
        });
    });

    it('unhide comment error', () => {
        const action = CommentsActions.unhideCommentError({
            error: {
                statusCode: 24,
                timestamp: "123",
                operation: "Unhide Comment",
                message: "Server Failure",
                response: ""
            }
        });
        expect(action.type).toEqual(CommentsActions.UNHIDE_COMMENT_ERROR);
        expect(action.error).toEqual({
            statusCode: 24,
            timestamp: "123",
            operation: "Unhide Comment",
            message: "Server Failure",
            response: ""
        });
    });
    
});