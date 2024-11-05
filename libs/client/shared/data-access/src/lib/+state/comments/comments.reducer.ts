import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { IParser } from '@orcha/common';
import { createReducer, on } from '@ngrx/store';
import * as CommentsActions from './comments.actions';
import { Comment, CommentQuery } from '@involvemint/shared/domain';


export const COMMENTS_KEY = 'Comments';

export type CommentStoreModel = IParser<Comment, typeof CommentQuery>;

export interface CommentsState {
    comments: EntityState<CommentStoreModel>;
    pagesLoaded: number;
}

export const commentsAdapter = createEntityAdapter<CommentStoreModel>();

export const initialState: CommentsState = {
    comments: commentsAdapter.getInitialState(),
    pagesLoaded: 0,
}

/** Defines the Comments Reducer and how state changes based on actions */
export const CommentsReducer = createReducer(
    initialState,
    on(
        CommentsActions.loadCommentsSuccess,
        (state, { comments, page }): CommentsState => {
            return {
                comments: commentsAdapter.upsertMany(comments, state.comments),
                pagesLoaded: page,
            }
        }
    ),
    on(
        CommentsActions.createCommentSuccess,
        (state, { comment }): CommentsState => {
            return {
                ...state,
                comments: commentsAdapter.upsertOne(comment, state.comments)
            }
        }
    ),
    on( // reducer to add initial set of comments from post
        CommentsActions.initComments,
        (state, { comments }): CommentsState => {
            state = initialState;
            return {
                ...state,
                comments: commentsAdapter.upsertMany(comments, state.comments),
            }
        }
    ),
    on(
        CommentsActions.flagCommentSuccess,
        (state, { comment }): CommentsState => {
            return {
                ...state,
                comments: commentsAdapter.upsertOne(comment, state.comments)
            }
        }
    ),
    on(
        CommentsActions.unflagCommentSuccess,
        (state, { comment }): CommentsState => {
            return {
                ...state,
                comments: commentsAdapter.upsertOne(comment, state.comments)
            }
        }
    ),
    on(
        CommentsActions.hideCommentSuccess,
        (state, { comment }): CommentsState => {
            return {
                ...state,
                comments: commentsAdapter.upsertOne(comment, state.comments)
            }
        }
    ),
    on(
        CommentsActions.unhideCommentSuccess,
        (state, { comment }): CommentsState => {
            return {
                ...state,
                comments: commentsAdapter.upsertOne(comment, state.comments)
            }
        }
    ),
)
