import { ActivityPost, ActivityPostQuery } from '@involvemint/shared/domain';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { IParser } from '@orcha/common';
import { createReducer, on } from '@ngrx/store';
import * as PostsActions from './activity-posts.actions';


/**
 * Activity Post Reducer.
 * 
 * A 'reducer' is a component of Angular state management that listens for 
 * actions and performs state change to reduce the incoming data from the action
 * into the existing state. There is a 'PostState' which defines the structure of
 * the state for the reducer, and an 'initialState' which defines the initial values
 * for the state (which is inputted to reduce new state when actions passed).
 * 
 * Ex:
 * loadPostsSuccess => listens for the 'loadPostsSuccess' action (outputted by PostEffects) and 
 *                     creates a new PostState by taking the existing state and the values passed
 *                     by the 'loadPostsSuccess' (posts, page, limit) and merging them. This specific
 *                     reducer does so by adding the new posts to the existing state posts, updating page
 *                     to be the value of the action passed page, and checking the length of posts list
 *                     returned.
 */

export const POSTS_KEY = 'posts';

export type PostStoreModel = IParser<ActivityPost, typeof ActivityPostQuery>;

export interface PostsState {
    posts: EntityState<PostStoreModel>;
    pagesLoaded: number;
    limit: number;
    allPagesLoaded: boolean;
}

export const postsAdapter = createEntityAdapter<PostStoreModel>();

export const initialState: PostsState = {
    posts: postsAdapter.getInitialState(),
    pagesLoaded: 0,
    limit: 10,
    allPagesLoaded: false,
}

export const PostsReducer = createReducer(
    initialState,
    on(
        PostsActions.loadPostsSuccess,
        (state, { posts, page, limit }): PostsState => {
            return {
                ...state,
                posts: postsAdapter.upsertMany(posts, state.posts),
                pagesLoaded: page,
                allPagesLoaded: (posts.length % limit !== 0) || (posts.length === 0),
            }
        }
    ),
    on(
        PostsActions.getPostSuccess,
        (state, { post }): PostsState => {
            return {
                ...state,
                posts: postsAdapter.upsertOne(post, state.posts)
            }
        }
    ),
    on(
        PostsActions.createPostSuccess,
        (state, { post }): PostsState => {
            return {
                ...state,
                posts: postsAdapter.upsertOne(post, state.posts)
            }
        }
    ),
    on(
        PostsActions.likeSuccess,
        (state, { post }): PostsState => {
            return {
                ...state,
                posts: postsAdapter.upsertOne(post, state.posts)
            }
        }
    ),
    on(
        PostsActions.unlikeSuccess,
        (state, { post }): PostsState => {
            return {
                ...state,
                posts: postsAdapter.upsertOne(post, state.posts)
            }
        }
    ),

)
