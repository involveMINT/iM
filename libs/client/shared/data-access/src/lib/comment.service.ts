import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { RouteService } from '@involvemint/client/shared/routes';
import { StatefulComponent, StatusService } from '@involvemint/client/shared/util';
import {
  Comments,
  FormattedComments,
} from '@involvemint/shared/domain';
import { compareDesc } from 'date-fns';
import firebase from 'firebase/app';
import lodash from 'lodash';
import { combineLatest } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import * as uuid from 'uuid';
import { ActiveProfile } from './+state/session/user-session.reducer';
import { UserFacade } from './+state/user.facade';

interface State {
  poiComments: FormattedComments[];
}

@Injectable({ providedIn: 'root' })
export class CommentService extends StatefulComponent<State> {
  private readonly collection = this.afs.collection<Comments>('comments');

  readonly store$ = this.state$;

  constructor(
    private readonly afs: AngularFirestore,
    private readonly uf: UserFacade,
    private readonly route: RouteService,
    private readonly status: StatusService,
  ) {
    super({ poiComments: [] });
  }

  async upsert() {
    /* create chat room */
    const data: Comments = {
      id: uuid.v4(),
      comments: []
    };

    await this.collection.doc(data.id).set(data);
    return this.goToComments(data.id);
  }

  async goToComments(postId: string) {
    console.log('goToComments', postId);
    console.log('goToComments2', this.route.to.comments.THREAD(postId));
    return this.route.to.comments.THREAD(postId);
  }
}