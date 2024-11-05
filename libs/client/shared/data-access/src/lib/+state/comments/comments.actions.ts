import { CreateCommentDto, FlagCommentDto, HideCommentDto, UnflagCommentDto, UnhideCommentDto } from "@involvemint/shared/domain";
import { createAction, props } from "@ngrx/store";
import { OrchaOperationError } from "@orcha/common";
import { CommentStoreModel } from "./comments.reducer";


export const LOAD_COMMENTS = '[Comments] Comments Load';
export const LOAD_COMMENTS_SUCCESS = '[Comments] Comments Load Success';
export const LOAD_COMMENTS_ERROR = '[Comments] Comments Load Error';

export const CREATE_COMMENT = '[Comments] Comments Create';
export const CREATE_COMMENT_SUCCESS = '[Comments] Comments Create Success';
export const CREATE_COMMENT_ERROR = '[Comments] Comments Create Error';

export const INIT_COMMENTS = '[Comments] Comments Init';

export const FLAG_COMMENT = '[Comments] Flag Comment';
export const FLAG_COMMENT_SUCCESS = '[Comments] Flag Comment Success';
export const FLAG_COMMENT_ERROR = '[Comments] Flag Comment Error';

export const UNFLAG_COMMENT = '[Comments] Unflag Comment';
export const UNFLAG_COMMENT_SUCCESS = '[Comments] Unflag Comment Success';
export const UNFLAG_COMMENT_ERROR = '[Comments] Unflag Comment Error';

export const HIDE_COMMENT = '[Comment] Hide Comment';
export const HIDE_COMMENT_SUCCESS = '[Comment] Hide Comment Success';
export const HIDE_COMMENT_ERROR = '[Comment] Hide Comment Error';

export const UNHIDE_COMMENT = '[Comment] Unhide Comment';
export const UNHIDE_COMMENT_SUCCESS = '[Comment] Unhide Comment Success';
export const UNHIDE_COMMENT_ERROR = '[Comment] Unhide Comment Error';

/**
 * Actions for loading comments
 */
 export const loadComments = createAction(
    LOAD_COMMENTS, 
    props<{ page: number }>()
);

export const loadCommentsSuccess = createAction(
    LOAD_COMMENTS_SUCCESS,
    props<{ comments: CommentStoreModel[]; page: number }>()
);

export const loadCommentsError = createAction(
    LOAD_COMMENTS_ERROR,
    props<{ error: OrchaOperationError }>()
);


/**
 * Actions for creating comment
 */

export const createComment = createAction(
    CREATE_COMMENT,
    props<{ dto: CreateCommentDto }>()
);

export const createCommentSuccess = createAction(
    CREATE_COMMENT_SUCCESS,
    props<{ comment: CommentStoreModel }>()
);

export const createCommentError = createAction(
    CREATE_COMMENT_ERROR,
    props<{ error: OrchaOperationError }>()
);

/**
 * Action to load comment modal with comments from a post
 */
export const initComments = createAction(
    INIT_COMMENTS,
    props<{ comments: CommentStoreModel[] }>()
);

/**
 * Actions for flagging a comment
 */

export const flagComment = createAction(
    FLAG_COMMENT,
    props<{ dto: FlagCommentDto }>()
);

export const flagCommentSuccess = createAction(
    FLAG_COMMENT_SUCCESS,
    props<{ comment: CommentStoreModel }>()
);

export const flagCommentError = createAction(
    FLAG_COMMENT_ERROR,
    props<{ error: OrchaOperationError }>()
);

export const unflagComment = createAction(
    UNFLAG_COMMENT,
    props<{ dto: UnflagCommentDto }>()
);

export const unflagCommentSuccess = createAction(
    UNFLAG_COMMENT_SUCCESS,
    props<{ comment: CommentStoreModel }>()
);

export const unflagCommentError = createAction(
    UNFLAG_COMMENT_ERROR,
    props<{ error: OrchaOperationError }>()
);

/**
 * Actions for hiding a comment
 */

 export const hideComment = createAction(
    HIDE_COMMENT,
    props<{ dto: HideCommentDto }>()
);

export const hideCommentSuccess = createAction(
    HIDE_COMMENT_SUCCESS,
    props<{ comment: CommentStoreModel }>()
);

export const hideCommentError = createAction(
    HIDE_COMMENT_ERROR,
    props<{ error: OrchaOperationError }>()
);

/**
 * Actions for unhiding a comment
 */

 export const unhideComment = createAction(
    UNHIDE_COMMENT,
    props<{ dto: UnhideCommentDto }>()
);

export const unhideCommentSuccess = createAction(
    UNHIDE_COMMENT_SUCCESS,
    props<{ comment: CommentStoreModel }>()
);

export const unhideCommentError = createAction(
    UNHIDE_COMMENT_ERROR,
    props<{ error: OrchaOperationError }>()
);