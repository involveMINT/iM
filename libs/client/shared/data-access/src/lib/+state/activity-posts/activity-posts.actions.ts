import { createAction, props } from '@ngrx/store';
import { OrchaOperationError } from '@orcha/common';
import { CreateActivityPostDto, GetActivityPostDto, LikeActivityPostDto, UnlikeActivityPostDto } from '@involvemint/shared/domain';
import { PostStoreModel } from './activity-posts.reducer';


/**
 * Constant Type Values
 */
export const LOAD_POSTS =  '[Activity Posts] Activity Posts Load';
export const LOAD_POSTS_SUCCESS = '[Activity Posts] Activity Posts Load Success';
export const LOAD_POSTS_ERROR = '[Activity Posts] Activity Posts Load Error';

export const GET_POST = '[Activity Posts] Activity Posts Get';
export const GET_POST_SUCCESS = '[Activity Posts] Activity Posts Get Success';
export const GET_POST_ERROR = '[Activity Posts] Activity Posts Get Error';

export const CREATE_POST = '[Activity Posts] Activity Posts Create';
export const CREATE_POST_SUCCESS = '[Activity Posts] Activity Posts Create Success';
export const CREATE_POST_ERROR = '[Activity Posts] Activity Posts Create Error';

export const LIKE_POST = '[Activity Posts] Like Activity Post';
export const LIKE_POST_SUCCESS = '[Activity Posts] Like Activity Post Success';
export const LIKE_POST_ERROR = '[Activity Posts] Like Activity Post Error';

export const UNLIKE_POST = '[Activity Posts] unlike Activity Post';
export const UNLIKE_POST_SUCCESS = '[Activity Posts] unlike Activity Post Success';
export const UNLIKE_POST_ERROR = '[Activity Posts] unlike Activity Post Error';


/**
 * Actions for loading activity post
 */
export const loadPosts = createAction(
    LOAD_POSTS,
    props<{ page: number; limit: number }>()
);

export const loadPostsSuccess = createAction(
    LOAD_POSTS_SUCCESS,
    props<{ posts: PostStoreModel[]; page: number; limit: number }>()
);

export const loadPostsError = createAction(
    LOAD_POSTS_ERROR,
    props<{ error: OrchaOperationError }>()
);

/**
 * Actions for creating activity post
 */
export const createPost = createAction(
    CREATE_POST,
    props<{ dto: CreateActivityPostDto }>() // not entirely sure which should go here...
);

export const createPostSuccess = createAction(
    CREATE_POST_SUCCESS,
    props<{ post: PostStoreModel }>()
);

export const createPostError = createAction(
    CREATE_POST_ERROR,
    props<{ error: OrchaOperationError }>()
);

export const getPost = createAction(
    GET_POST,
    props<{ dto: GetActivityPostDto }>()
);

export const getPostSuccess = createAction(
    GET_POST_SUCCESS,
    props<{ post: PostStoreModel }>()
)

export const getPostError = createAction(
    GET_POST_ERROR,
    props<{ error: OrchaOperationError }>()
);

export const like = createAction(
    LIKE_POST, 
    props<{ dto: LikeActivityPostDto }>()
);

export const likeSuccess = createAction(
    LIKE_POST_SUCCESS,
    props<{ post: PostStoreModel }>()
);

export const likeError = createAction(
    LIKE_POST_ERROR,
    props<{ error: OrchaOperationError }>()
);

export const unlike = createAction(
    UNLIKE_POST,
    props<{ dto: UnlikeActivityPostDto }>()
);

export const unlikeSuccess = createAction(
    UNLIKE_POST_SUCCESS,
    props<{ post: PostStoreModel }>()
);

export const unlikeError = createAction(
    UNLIKE_POST_ERROR,
    props<{ error: OrchaOperationError }>()
);
