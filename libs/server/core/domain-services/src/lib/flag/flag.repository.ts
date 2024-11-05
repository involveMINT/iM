import { Flag } from "@involvemint/shared/domain";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IOrchaTypeormRepository } from '@orcha/typeorm';
import { FlagEntity } from './flag.entity';
import { Repository } from 'typeorm';


@Injectable()
export class FlagRepository extends IOrchaTypeormRepository<Flag> {
    constructor(@InjectRepository(FlagEntity) protected readonly repo: Repository<Flag>) {
        super(repo);
    }
}
