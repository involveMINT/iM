import { StatusService } from "@involvemint/client/shared/util";
import { asyncScheduler, Observable, of, throwError } from "rxjs";
import { CommentOrchestration } from "../../orchestrations";
import { CommentEffects } from "./comments.effects";
import { Action } from "@ngrx/store";
import { provideMockActions } from '@ngrx/effects/testing';
import { TestBed } from "@angular/core/testing";
import { hot, cold } from 'jest-marbles';

import * as CommentActions from './comments.actions';

describe('Comments Effects', () => {

    let actions: Observable<Action>;
    let effects: CommentEffects;
    let status: StatusService;
    let comments: CommentOrchestration;

    beforeEach(() => {
        const module = TestBed.configureTestingModule({
            providers: [
                CommentEffects,
                provideMockActions(() => actions),
                {
                    provide: StatusService,
                    useValue: {
                        showLoader: jest.fn(),
                        dismissLoader: jest.fn(),
                        presentNgRxActionAlert: jest.fn(),
                    }
                },
                {
                    provide: CommentOrchestration,
                    useValue: {
                        list: jest.fn(),
                        create: jest.fn(),
                        flag: jest.fn(),
                        unflag: jest.fn(),
                        hide: jest.fn(),
                        unhide: jest.fn(),
                    }
                }
            ]
        });

        effects = module.get(CommentEffects);

        status = module.get(StatusService);
        comments = module.get(CommentOrchestration);

        // mock generic functions for all tests
        jest.spyOn(status, 'presentNgRxActionAlert')
            .mockImplementation(async (_action: any, error: any) => {
                return;
            });
        jest.spyOn(status, 'showLoader')
            .mockImplementation(async () => { return });
        jest.spyOn(status, 'dismissLoader')
            .mockImplementation(async () => { return });
    });

    it('should be defined', () => {
        expect(effects).toBeTruthy();
        expect(status).toBeTruthy();
        expect(comments).toBeTruthy();
    });

    it('should return load comments success on happy path', () => {
        // provide fake data that will be used in effect
        const fakeComments = [
            { id: "1"} as any,
            { id: "2"} as any,
        ];
        const action = CommentActions.loadComments({ page: 1 });
        const completion = CommentActions.loadCommentsSuccess({ 
            comments: fakeComments,
            page: 1,
        });

        // mock 'this.comments.list' call and return OBSERVABLE data!
        jest.spyOn(comments, 'list')
            .mockImplementation((_query: any) => {
                return of(fakeComments);
            });
        
        // mock the observable action passed to effects
        actions = hot('--a-', { a: action });

        //specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.loadComments$).toBeObservable(expected);
    });

    it('should return load comments failure on error', () => {
        // provide fake data that will be used in effect
        const action = CommentActions.loadComments({ page: 1 });
        const completion = CommentActions.loadCommentsError({ error: undefined as any });

        // mock 'this.comments.list' call and return OBSERVABLE data!
        jest.spyOn(comments, 'list')
            .mockImplementation((_query: any) => {
                throw throwError("error");
            });
        
        // mock the observable action passed to effects
        actions = hot('--a-', { a: action });

        //specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.loadComments$).toBeObservable(expected);
    });

    it('should return flag comment success on happy path', () => {
        // provide fake data that will be used in effect
        const fakeComment = { id: "1"} as any;
        const action = CommentActions.flagComment({ dto: { commentId: "1" } });
        const completion = CommentActions.flagCommentSuccess({ comment: fakeComment });

        // mock 'this.comments.flag' call and return OBSERVABLE data!
        jest.spyOn(comments, 'flag')
            .mockImplementation((_query: any, _dto: any) => {
                return of(fakeComment);
            });
        
        // specify expected output and run test
        actions = hot('--a-', { a: action });

        //specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.flagComment$).toBeObservable(expected);
    });

    it('should return flag comment failure on error', () => {
        const action = CommentActions.flagComment({ dto: { commentId: "1" } });
        const completion = CommentActions.flagCommentError({ error: undefined as any });

        jest.spyOn(comments, 'flag')
            .mockImplementation((_query: any, _dto: any) => {
                throw throwError("error");
            });

        // specify expected output and run test
        actions = hot('--a-', { a: action });

        //specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.flagComment$).toBeObservable(expected);
    });

    it('should return unflag comment success on happy path', () => {
        // provide fake data that will be used in effect
        const fakeComment = { id: "1"} as any;
        const action = CommentActions.unflagComment({ dto: { commentId: "1" } });
        const completion = CommentActions.unflagCommentSuccess({ comment: fakeComment });

        // mock 'this.comments.unflag' call and return OBSERVABLE data!
        jest.spyOn(comments, 'unflag')
            .mockImplementation((_query: any, _dto: any) => {
                return of(fakeComment);
            });

        // specify expected output and run test
        actions = hot('--a-', { a: action });

        //specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.unflagComment$).toBeObservable(expected);
    });

    it('should return unflag comment failure on unhappy path', () => {
        const action = CommentActions.unflagComment({ dto: { commentId: "1" } });
        const completion = CommentActions.unflagCommentError({ error: undefined as any });

        jest.spyOn(comments, 'unflag')
            .mockImplementation((_query: any, _dto: any) => {
                throw throwError("error");
            });

        // specify expected output and run test
        actions = hot('--a-', { a: action });

        //specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.unflagComment$).toBeObservable(expected);
    });

    it('should return hide comment success on happy path', () => {
        // provide fake data that will be used in effect
        const fakeComment = { id: "1"} as any;
        const action = CommentActions.hideComment({ dto: { commentId: "1" } });
        const completion = CommentActions.hideCommentSuccess({ comment: fakeComment });

        // mock 'this.comments.hide' call and return OBSERVABLE data!
        jest.spyOn(comments, 'hide')
            .mockImplementation((_query: any, _dto: any) => {
                return of(fakeComment);
            });

        // specify expected output and run test
        actions = hot('--a-', { a: action });

        //specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.hideComment$).toBeObservable(expected);
    });

    it('should return hide comment failure on unhappy path', () => {
        const action = CommentActions.hideComment({ dto: { commentId: "1" } });
        const completion = CommentActions.hideCommentError({ error: undefined as any });

        jest.spyOn(comments, 'hide')
            .mockImplementation((_query: any, _dto: any) => {
                throw throwError("error");
            });

        // specify expected output and run test
        actions = hot('--a-', { a: action });

        //specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.hideComment$).toBeObservable(expected);
    });

    it('should return unhide comment success on happy path', () => {
        // provide fake data that will be used in effect
        const fakeComment = { id: "1"} as any;
        const action = CommentActions.unhideComment({ dto: { commentId: "1" } });
        const completion = CommentActions.unhideCommentSuccess({ comment: fakeComment });

        // mock 'this.comments.unhide' call and return OBSERVABLE data!
        jest.spyOn(comments, 'unhide')
            .mockImplementation((_query: any, _dto: any) => {
                return of(fakeComment);
            });

        // specify expected output and run test
        actions = hot('--a-', { a: action });

        //specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.unhideComment$).toBeObservable(expected);
    });

    it('should return unhide comment failure on unhappy path', () => {
        const action = CommentActions.unhideComment({ dto: { commentId: "1" } });
        const completion = CommentActions.unhideCommentError({ error: undefined as any });

        jest.spyOn(comments, 'unhide')
            .mockImplementation((_query: any, _dto: any) => {
                throw throwError("error");
            });

        // specify expected output and run test
        actions = hot('--a-', { a: action });

        //specify expected output and run test
        const expected = cold('--(b)', { b: completion });
        expect(effects.unhideComment$).toBeObservable(expected);
    });
    
});

        