import { createFeatureSelector, createSelector } from '@ngrx/store';
import { COMMENTS_KEY, CommentsState, commentsAdapter } from './comments.reducer';

const { selectAll, selectEntities } = commentsAdapter.getSelectors();
const getCommentsState = createFeatureSelector<CommentsState>(COMMENTS_KEY);

export const getComments = createSelector(getCommentsState, (state: CommentsState) => ({
    comments: selectAll(state.comments),
    pagesLoaded: state.pagesLoaded,
    loaded: state.pagesLoaded > 0,
}));

export const getComment = (id: string) => 
    createSelector(getCommentsState, (state: CommentsState) => ({
        comment: selectEntities(state.comments)[id],
        pagesLoaded: state.pagesLoaded,
        loaded: state.pagesLoaded > 0,
    }));

