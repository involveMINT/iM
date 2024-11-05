import { Like } from "@involvemint/shared/domain";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IOrchaTypeormRepository } from '@orcha/typeorm';
import { LikeEntity } from './like.entity';
import { Repository } from 'typeorm';


@Injectable()
export class LikeRepository extends IOrchaTypeormRepository<Like> {
    constructor(@InjectRepository(LikeEntity) protected readonly repo: Repository<Like>) {
        super(repo);
    }
}
