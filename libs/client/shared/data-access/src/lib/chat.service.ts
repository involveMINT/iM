import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { RouteService } from '@involvemint/client/shared/routes';
import { StatefulComponent, StatusService } from '@involvemint/client/shared/util';
import {
  ChatRoom,
  createChatMember,
  FormattedChatRoom,
  getUnreadMessagesCount,
  NewChatMember,
} from '@involvemint/shared/domain';
import { compareDesc } from 'date-fns';
import firebase from 'firebase/app';
import lodash from 'lodash';
import { combineLatest } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import * as uuid from 'uuid';
import { ActiveProfile } from './+state/session/user-session.reducer';
import { UserFacade } from './+state/user.facade';
import { ChatOrchestration } from './orchestrations';

interface State {
  myChats: FormattedChatRoom[];
  unreadMessages: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService extends StatefulComponent<State> {
  private readonly collection = this.afs.collection<ChatRoom>('chats');

  readonly store$ = this.state$;

  constructor(
    private readonly afs: AngularFirestore,
    private readonly uf: UserFacade,
    private readonly route: RouteService,
    private readonly status: StatusService,
    private readonly chatOrcha: ChatOrchestration
  ) {
    super({ myChats: [], unreadMessages: 0 });

    this.effect(() =>
      this.uf.session.selectors.activeProfile$.pipe(
        switchMap(({ handle }) =>
          this.afs
            .collection<ChatRoom>('chats', (ref) => ref.where('memberHandles', 'array-contains', handle.id))
            .snapshotChanges()
            .pipe(
              tap((rooms) => {
                // Format chats.
                const chats = rooms.map((room) => {
                  const data = room.payload.doc.data();
                  return this.formatChatRoom(room.payload.doc.id, data, handle.id);
                });

                this.updateState({
                  myChats: chats,
                  unreadMessages: getUnreadMessagesCount(handle.id, chats),
                });
              })
            )
        )
      )
    );
  }

  get(chatId: string) {
    return combineLatest([
      this.collection.doc<ChatRoom>(chatId).snapshotChanges(),
      this.uf.session.selectors.activeProfile$,
    ]).pipe(
      map(([doc, { handle }]) => {
        const room = doc.payload.data();
        if (!room) throw new Error('Chat room does not exist');
        return this.formatChatRoom(doc.payload.id, room, handle.id);
      })
    );
  }

  /**
   * @param members Chat room members ! exclude yourself
   */
  async upsert(members: NewChatMember[]) {
    const me = await this.uf.session.selectors.activeProfile$.pipe(take(1)).toPromise();
    if (members.find((m) => m.handleId === me.handle.id)) {
      this.status.presentAlert({ title: 'Error', description: 'Cannot send a message to yourself!' });
      return;
    }

    /* Find if there is an existing chat room */

    const _myRooms = this.afs.collection<ChatRoom>('chats', (ref) =>
      ref.where('memberHandles', 'array-contains', me.handle.id)
    );

    const myRooms = await _myRooms.get().pipe(take(1)).toPromise();

    const wantedMembers = [...members.map(m => m.handleId), me.handle.id].sort()
    const existingRooms = myRooms.docs
      .map((d) => d.data() as ChatRoom)
      .filter((r) => lodash.isEqual(wantedMembers, r.memberHandles.sort()))

    if (existingRooms.length > 0) {
      const alreadyExistingRoom = existingRooms[0];
      return this.goToChatRoom(alreadyExistingRoom.id);
    }

    /* If no chat room is found, create one */

    const data: ChatRoom = {
      id: uuid.v4(),
      members: [...members.map((m) => ({ ...m, numberUnread: 0 })), createChatMember(me.handle.id)],
      memberHandles: [...members.map((m) => m.handleId), me.handle.id],
      createdAt: firebase.firestore.Timestamp.now(),
      count: 0,
      messages: [],
    };

    await this.collection.doc(data.id).set(data);
    return this.goToChatRoom(data.id);
  }

  async sendMessage(chatRoomId: string, content: string) {
    const me = await this.uf.session.selectors.activeProfile$.pipe(take(1)).toPromise();

    await this.chatOrcha
      .sendMessage(undefined, { chatRoomId: chatRoomId, content, senderHandleId: me.handle.id })
      .pipe(take(1))
      .toPromise();
  }

  resetUnreadMessages(chatRoom: ChatRoom, me: ActiveProfile) {
    for (const member of chatRoom.members) {
      if (member.handleId === me.handle.id) {
        member.numberUnread = 0;
        break;
      }
    }
    const ref = this.collection.doc(chatRoom.id);
    return ref.update({ members: chatRoom.members });
  }

  async goToChatRoom(roomId: string) {
    const { id } = await this.uf.session.selectors.activeProfile$.pipe(take(1)).toPromise();
    return this.route.to.chat.ROOM(roomId, { queryParams: { profile: id } });
  }

  private formatChatRoom(roomId: string, room: ChatRoom, myHandle: string): FormattedChatRoom {
    return {
      ...room,
      id: roomId,
      notMe: room.members
        .filter((m) => m.handleId !== myHandle)
        .map((m) => `@${m.handleId}`)
        .join(', '),
      lastMessage: room.messages.map((m) => m.createdAt.toDate()).sort((a, b) => compareDesc(a, b))[0],
    };
  }
}
