import { Injectable } from "@nestjs/common";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { AuthService } from '@involvemint/server/core/application-services';
import { CommentRepository, FlagRepository } from "@involvemint/server/core/domain-services";
import { IQuery } from '@orcha/common';
import * as uuid from 'uuid';
import { CreateCommentDto, UnflagCommentDto } from "@involvemint/shared/domain";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { Comment, CommentQuery, HideCommentDto, UnhideCommentDto, FlagCommentDto, flagQuery } from "@involvemint/shared/domain";

@Injectable()
export class CommentService {
    constructor(
        private readonly auth: AuthService,
        private readonly commentRepo: CommentRepository,
        private readonly flagRepo: FlagRepository
    ) {}

    async list(query: IQuery<Comment[]>, token: string) {
        return this.commentRepo.findAll(query);
    }

    async create(query: IQuery<Comment>, token: string, dto: CreateCommentDto) {
        const user = await this.auth.validateUserToken(token ?? '');
        return this.commentRepo.upsert({
            id: uuid.v4(),
            text: dto.text,
            activityPost: dto.postId,
            user: user.id,
            dateCreated: new Date(),
            hidden: false,
            flags: [],
            flagCount: 0,
            handleId: dto.handleId,
            profilePicFilePath: dto.profilePicFilePath,
            name: dto.name,
        },
        query);
    }

    async hide(query: IQuery<Comment>, token: string, dto: HideCommentDto) {
        const admin = await this.auth.validateAdminToken(token ?? '');
        return this.commentRepo.update(dto.commentId, {
            hidden: true
        },
        query);
    }

    async unhide(query: IQuery<Comment>, token: string, dto: UnhideCommentDto) {
        const admin = await this.auth.validateAdminToken(token ?? '');
        return this.commentRepo.update(dto.commentId, {
            hidden: false
        },
        query);
    }

    async flag(query: IQuery<Comment>, token: string, dto: FlagCommentDto) {
        const user = await this.auth.validateUserToken(token ?? '');
        const flagRecords = await this.flagRepo.query(flagQuery, { where: { user:user.id, comment: dto.commentId } });
        if (flagRecords.length > 0) {
            throw new Error('User has already flagged this comment.');
        }

        await this.flagRepo.upsert({
            id: uuid.v4(),
            dateCreated: new Date(),
            comment: dto.commentId,
            user: user.id
        },
        flagQuery);

        const currentComment = await this.commentRepo.findOneOrFail(dto.commentId, CommentQuery);
        return this.commentRepo.update(dto.commentId, {flagCount: currentComment.flagCount + 1}, query);
    }

    async unflag(query: IQuery<Comment>, token: string, dto: UnflagCommentDto) {
        const user = await this.auth.validateUserToken(token ?? '');
        // make sure user flagged the post
        const flagRecords = await this.flagRepo.query(flagQuery, { where: { user:user.id, comment: dto.commentId } });
        if (flagRecords.length == 0) {
            throw new Error('User has not flagged this comment');
        }

        // Remove flag record from flag repo
        // We can index into 1st index because we do the check above
        await this.flagRepo.delete(flagRecords[0].id);

        // update activity post like counter
        const currentComment = await this.commentRepo.findOneOrFail(dto.commentId, CommentQuery);
        return this.commentRepo.update(dto.commentId, {flagCount: currentComment.flagCount - 1}, query);;
    }
}
