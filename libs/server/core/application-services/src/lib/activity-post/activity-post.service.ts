import { Injectable } from "@nestjs/common";
import { ActivityPostRepository, LikeRepository, UserRepository } from "@involvemint/server/core/domain-services";
import { IPaginate, IParserObject, IQuery } from "@orcha/common";
import { AuthService } from '../auth/auth.service';
import * as uuid from 'uuid';
import { IQueryObject } from "@orcha/common/src/lib/query";
import { ActivityPost, ActivityPostQuery, CreateActivityPostDto, DigestActivityPostDto, DisableActivityPostDto, EnableActivityPostDto, GetActivityPostDto, LikeActivityPostDto, likeQuery, UnlikeActivityPostDto } from "@involvemint/shared/domain";
import { Cron } from "@nestjs/schedule"
import { SMSService } from "../sms/sms.service";
import { UserQuery } from '@involvemint/shared/domain';


/**
 * Activity Post Service.
 * 
 * A 'service' implements the backend logic required for orchestration methods
 * defined in functions such as 'ActivityPostOrchestration'. They are responsible
 * for validating inputs, performing checks, and updating the databases as
 * required. They consume repositories (databases) and other services to implement
 * the logic required. ActivityPostService is used in Server implementation of 
 * 'ActivityPostOrchestration' to wrap all the calls.
 * 
 * Ex:
 * like => Logically, adds a like to an activity post... 1) validates user 
 *         2) checks user already liked  3) adds record to like table
 *         4) updates like count and returns the like post
 */
@Injectable()
export class ActivityPostService {
    constructor(
        private readonly auth: AuthService,
        private readonly activityPostRepo: ActivityPostRepository,
        private readonly likeRepo: LikeRepository,
        private readonly sms: SMSService,
        private readonly user: UserRepository
    ) {}

    async list(query: IQuery<ActivityPost[]>, token: string) {
        return this.activityPostRepo.query(query, { where: { enabled: true }});
    }

    async get(query: IQuery<ActivityPost>, token: string, dto: GetActivityPostDto) {
        const _user = await this.auth.validateUserToken(token ?? '');
        return this.activityPostRepo.findOneOrFail(dto.postId, query);
    }

    async create(query: IQuery<ActivityPost>, token: string, dto: CreateActivityPostDto) {
        const user = await this.auth.validateUserToken(token ?? '');
        return this.activityPostRepo.upsert({
            id: uuid.v4(),
            user: user.id,
            poi: dto.poiId,
            likes: [],
            comments: [],
            likeCount: 0,
            dateCreated: new Date(),
            enabled: true
        },
        query);
    }

    async enable(query: IQuery<ActivityPost>, token: string, dto: EnableActivityPostDto) {
        return this.activityPostRepo.upsert({
            id: "",
            likeCount: 0,
            poi: undefined,
            likes: [],
            comments: [],
            user: undefined,
            dateCreated: "",
            enabled: false
        },
        query);
    }

    async disable(query: IQuery<ActivityPost>, token: string, dto: DisableActivityPostDto) {
        return this.activityPostRepo.upsert({
            id: "",
            likeCount: 0,
            poi: undefined,
            likes: [],
            comments: [],
            user: undefined,
            dateCreated: "",
            enabled: false
        },
        query);
    }

    /**
     * 1) Validate user
     * 2) Check if user already liked
     * 3) insert new record into table
     * 4) update post and return post 
     */
    async like(query: IQuery<ActivityPost>, token: string, dto: LikeActivityPostDto) {
        const user = await this.auth.validateUserToken(token ?? '');
        const likeRecords = await this.likeRepo.query(likeQuery, { where: { user: user.id, activityPost: dto.postId } });
        if (likeRecords.length > 0) {
            throw new Error('User already liked this activity post');
        }
       await this.likeRepo.upsert({
            id: uuid.v4(),
            dateCreated: new Date(),
            activityPost: dto.postId,
            user: user.id
        },
        likeQuery);
        const currentPost = await this.activityPostRepo.findOneOrFail(dto.postId, ActivityPostQuery);
        return this.activityPostRepo.update(dto.postId, {likeCount: currentPost.likeCount + 1}, query);
    }

    /**
     * 1) validate user
     * 2) check user has liked
     * 3) remove like from database
     * 4) update the post and return
     */
    async unlike(query: IQuery<ActivityPost>, token: string, dto: UnlikeActivityPostDto) {
        const user = await this.auth.validateUserToken(token ?? '');
        const likeRecords = await this.likeRepo.query(likeQuery, { where: { user: user.id, activityPost: dto.postId } });
        if (likeRecords.length == 0) {
            throw new Error('User has not liked this activity post');
        }
        await this.likeRepo.delete(likeRecords[0].id);
        const currentPost = await this.activityPostRepo.findOneOrFail(dto.postId, ActivityPostQuery);
        return this.activityPostRepo.update(dto.postId, {likeCount: currentPost.likeCount - 1}, query);
    }

    async digest(query: IQuery<ActivityPost[]>, token: string, dto: DigestActivityPostDto) {
        const user = await this.auth.validateUserToken(token ?? '');
        const startDate = new Date(dto.startDate);
        const posts = await this.activityPostRepo.query(query, { where: { user: user.id }}); // todo -> way to query for dates here instead??
        const res: IParserObject<ActivityPost, IQueryObject<ActivityPost> & IPaginate>[] = [];
        posts.forEach(post => {
            post.comments = post.comments?.filter(comment => new Date(comment?.dateCreated as any) >= startDate);
            post.likes = post.likes?.filter(like => new Date(like?.dateCreated as any) >= startDate);
            if ((post.comments?.length ?? 0 > 0) || (post.likes?.length ?? 0 > 0)) res.push(post);
        });
        return res;
    }

    // Send digest notification every tuesday at 8pm
    @Cron("0 20 * * 2")
    async sendNotificationDigestText(): Promise<void> {
        const allUsers = await this.user.findAll(UserQuery);
        allUsers.forEach( async (user) => {
            if (user.changeMaker?.id) {
                await this.sms.sendInfoSMS({
                    message: "Your activity posts are getting attention. Check your recent updates on the digest page.",
                    phone: user.changeMaker.phone,
                });
            }
        });
    }

}
