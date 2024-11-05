import { Injectable } from "@angular/core";
import { StatusService } from "@involvemint/client/shared/util";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import * as CommentsActions from './comments.actions';
import { map, delayWhen, tap } from 'rxjs/operators';
import { fetch, pessimisticUpdate } from "@nrwl/angular";
import { from } from 'rxjs';
import { CommentOrchestration } from "../../orchestrations/comment.orchestration";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { CommentQuery } from "libs/shared/domain/src/lib/domain/comment/comment.queries";

@Injectable()
export class CommentEffects {

    /** Effect when loadComments is dispatched */
    readonly loadComments$ = createEffect(() => 
        this.actions$.pipe(
            ofType(CommentsActions.loadComments),
            fetch({
                run: ({ page }) =>
                    this.comments.list({
                        ...CommentQuery
                    }).pipe(
                        map((comments) => {
                            return CommentsActions.loadCommentsSuccess({ comments: comments, page: page});
                        })
                    ),
                onError: (action, { error }) => {
                    this.status.presentNgRxActionAlert(action, error);
                    return CommentsActions.loadCommentsError({ error });
                }
            })
        )
    );

    /** Effects when createComment is dispatched */
    readonly createComment$ = createEffect(() => 
        this.actions$.pipe(
            ofType(CommentsActions.createComment),
            delayWhen(() => from(this.status.showLoader('Adding...'))),
            pessimisticUpdate({
                run: ({ dto }) => 
                    this.comments.create(
                        CommentQuery,
                        dto
                    ).pipe(
                        map((comment) => {
                            console.log('createCommentSuccess:', comment);
                            return CommentsActions.createCommentSuccess({ comment });
                        })
                    ),
                onError: (action, { error }) => {
                    this.status.presentNgRxActionAlert(action, error)
                    return CommentsActions.createCommentError({ error })
                }
            }),
            tap(() => this.status.dismissLoader())
        )
    );

    /** Effects when flagComment is dispatched */
    readonly flagComment$ = createEffect(() =>
        this.actions$.pipe(
            ofType(CommentsActions.flagComment),
            pessimisticUpdate({
                run: ({ dto }) =>
                    this.comments.flag(
                        CommentQuery,
                        dto
                    ).pipe(
                        map((comment) => CommentsActions.flagCommentSuccess({ comment }))
                    ),
                onError: (action, { error }) => {
                    this.status.presentNgRxActionAlert(action, error);
                    return CommentsActions.flagCommentError({ error });
                }
            }),
        )
    );

    /** Effects when unflagComment is dispatched */
    readonly unflagComment$ = createEffect(() =>
        this.actions$.pipe(
            ofType(CommentsActions.unflagComment),
            pessimisticUpdate({
                run: ({ dto }) =>
                    this.comments.unflag(
                        CommentQuery,
                        dto
                    ).pipe(
                        map((comment) => CommentsActions.unflagCommentSuccess({ comment }))
                    ),
                onError: (action, { error }) => {
                    this.status.presentNgRxActionAlert(action, error);
                    return CommentsActions.unflagCommentError({ error });
                }
            }),
        )
    );

    /** Effects when hideComment is dispatched */
readonly hideComment$ = createEffect(() =>
    this.actions$.pipe(
        ofType(CommentsActions.hideComment),
        pessimisticUpdate({
            run: ({ dto }) =>
                this.comments.hide(
                    CommentQuery,
                    dto
                ).pipe(
                    map((comment) => CommentsActions.hideCommentSuccess({ comment }))
                ),
            onError: (action, { error }) => {
                this.status.presentNgRxActionAlert(action, error);
                return CommentsActions.hideCommentError({ error });
            }
        }),
        tap(() => this.status.dismissLoader())
    )
);

/** Effects when unhideComment is dispatched */
readonly unhideComment$ = createEffect(() =>
    this.actions$.pipe(
        ofType(CommentsActions.unhideComment),
        pessimisticUpdate({
            run: ({ dto }) =>
                this.comments.unhide(
                    CommentQuery,
                    dto
                ).pipe(
                    map((comment) => CommentsActions.unhideCommentSuccess({ comment }))
                ),
            onError: (action, { error }) => {
                this.status.presentNgRxActionAlert(action, error);
                return CommentsActions.unhideCommentError({ error });
            }
        }),
        tap(() => this.status.dismissLoader())
    )
);
    
    constructor(
        private readonly actions$: Actions,
        private readonly status: StatusService,
        private readonly comments: CommentOrchestration,
    ) {}
}
