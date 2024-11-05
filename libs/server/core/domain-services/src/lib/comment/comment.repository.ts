import { Injectable } from '@nestjs/common';
import { IOrchaTypeormRepository } from '@orcha/typeorm';
import { Comment } from '@involvemint/shared/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentEntity } from './comment.entity';
import { Repository } from 'typeorm';


@Injectable()
export class CommentRepository extends IOrchaTypeormRepository<Comment> {
    constructor(@InjectRepository(CommentEntity) protected readonly repo: Repository<Comment>) {
        super(repo);
    }
}
