
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PostsState, postsAdapter, POSTS_KEY } from './activity-posts.reducer';

const { selectAll, selectEntities } = postsAdapter.getSelectors();
const getPostsState = createFeatureSelector<PostsState>(POSTS_KEY);

/**
 * Activity Post Selectors.
 * 
 * A 'selector' provides a memoized view of the Post State. It allows Angular
 * components to pull from a memoized view of the state that can be updated as
 * the data morphs.
 * 
 * Ex:
 * getPosts => provides a memoized view of the Post State by revealing all the 
 *             current posts, pages loaded, limit, and if all pages are loaded.
 */

export const getPosts = createSelector(getPostsState, (state: PostsState) => ({
    posts: selectAll(state.posts),
    pagesLoaded: state.pagesLoaded,
    loaded: state.pagesLoaded > 0,
    limit: state.limit,
    allPagesLoaded: state.allPagesLoaded,
}));

export const selectPost = (id: string) => 
    createSelector(getPostsState, (state: PostsState) => ({
        post: selectEntities(state.posts)[id],
        pagesLoaded: state.pagesLoaded,
        loaded: state.pagesLoaded > 0,
        limit: state.limit,
        allPagesLoaded: state.allPagesLoaded,
    }));
