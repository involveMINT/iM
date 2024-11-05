import { initialState, commentsAdapter, CommentsReducer } from "./comments.reducer";
import * as CommentsActions from './comments.actions';

describe('Comment Reducer', () => {

    beforeEach(() => {

        // reset the state to init
        initialState.pagesLoaded = 0;
        initialState.comments = {
            entities: {},
            ids: []
        };

        // spy methods used
        jest.spyOn(commentsAdapter, 'upsertMany')
            .mockImplementation((comments: any, existing: any) => {
                comments.forEach((comment: any) => {
                    existing.ids.push(comment.id);
                });
                return existing;
            });

        jest.spyOn(commentsAdapter, 'upsertOne')
            .mockImplementation((comment: any, existing: any) => {
                existing.ids.push(comment.id);
                return existing;
            });
    });

    afterEach(() => { jest.clearAllMocks(); })

    it('should return initial state when undefined start', () => {
        const newState = CommentsReducer(undefined, CommentsActions.loadComments);
        expect(newState).toEqual(initialState);
    });

    it('should return initial state when undefined start & action', () => {
        const newState = CommentsReducer(undefined, { type: 'NOOP' } as any);
        expect(newState).toEqual(initialState);
    });

    it('should return initial state on unknown action', () => {
        const newState = CommentsReducer(initialState, { type: 'NOOP' } as any);
        expect(newState).toEqual(initialState);
    });

    it('should return initial state on unregistered action', () => {
        const newState = CommentsReducer(
            initialState, 
            CommentsActions.flagComment({ dto: { commentId: "1"}})
        );
        expect(newState).toEqual(initialState);
    });

    it('should update comments & page on load comments success', () => {
        const action = CommentsActions.loadCommentsSuccess({ comments: [{ id: 1 }, { id: 2 }], page: 1 } as any);
        const newState = CommentsReducer(initialState, action);
        expect(commentsAdapter.upsertMany).toBeCalledTimes(1);
        expect(newState.pagesLoaded).toEqual(1);
        expect(newState.comments.ids.length).toEqual(2);
    });

    it('should add comment on create comment success', () => {
        const action = CommentsActions.createCommentSuccess({ comment: { id: 1 } } as any);
        const newState = CommentsReducer(initialState, action);
        expect(commentsAdapter.upsertOne).toBeCalledTimes(1);
        expect(newState).toEqual({
            comments: {
                entities: {},
                ids: [ 1 ]
            },
            pagesLoaded: 0
        });
    });

    it('should update comment on flag comment success', () => {
        const action = CommentsActions.flagCommentSuccess({ comment: { id: 1 } } as any);
        const newState = CommentsReducer(initialState, action);
        expect(commentsAdapter.upsertOne).toBeCalledTimes(1);
        expect(newState).toEqual({
            comments: {
                entities: {},
                ids: [ 1 ]
            },
            pagesLoaded: 0
        }); 
    });

    it('should update comment on unflag comment success', () => {
        const action = CommentsActions.unflagCommentSuccess({ comment: { id: 1 } } as any);
        const newState = CommentsReducer(initialState, action);
        expect(commentsAdapter.upsertOne).toBeCalledTimes(1);
        expect(newState).toEqual({
            comments: {
                entities: {},
                ids: [ 1 ]
            },
            pagesLoaded: 0
        });
    });

    it ('should update comment on hide comment success', () => {
        const action = CommentsActions.hideCommentSuccess({ comment: { id: 1 } } as any);
        const newState = CommentsReducer(initialState, action);
        expect(commentsAdapter.upsertOne).toBeCalledTimes(1);
        expect(newState).toEqual({
            comments: {
                entities: {},
                ids: [ 1 ]
            },
            pagesLoaded: 0
        });
    });

    it ('should update comment on unhide comment success', () => {
        const action = CommentsActions.unhideCommentSuccess({ comment: { id: 1 } } as any);
        const newState = CommentsReducer(initialState, action);
        expect(commentsAdapter.upsertOne).toBeCalledTimes(1);
        expect(newState).toEqual({
            comments: {
                entities: {},
                ids: [ 1 ]
            },
            pagesLoaded: 0
        });
    });

});