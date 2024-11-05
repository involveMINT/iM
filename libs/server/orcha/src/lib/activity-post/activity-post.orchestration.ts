import { ServerOrchestration, IServerOrchestration, ServerOperation } from '@orcha/nestjs';
import { ActivityPost, CreateActivityPostDto, DigestActivityPostDto, DisableActivityPostDto, EnableActivityPostDto, GetActivityPostDto, IActivityPostOrchestration, InvolvemintOrchestrations, LikeActivityPostDto, UnlikeActivityPostDto } from '@involvemint/shared/domain';
import { ActivityPostService } from '@involvemint/server/core/application-services';
import { IQuery } from '@orcha/common';


/**
 * Activity Post Orchestration (server)
 * 
 * Implements the orchestration methods defined in 'IActivityPostOrchestration,' but
 * for the server. The business logic for the method calls are handled by the 
 * ActivityPostService which gets forwarded the method arguments and returns the
 * appropriate values.
 */
@ServerOrchestration(InvolvemintOrchestrations.activityPost)
export class ActivityPostOrchestration implements IServerOrchestration<IActivityPostOrchestration> {
    constructor(private readonly activityPostService: ActivityPostService) {}

    @ServerOperation()
    list(query: IQuery<ActivityPost[]>, token: string) {
        return this.activityPostService.list(query, token);      
    }

    @ServerOperation()
    get(query: IQuery<ActivityPost>, token: string, dto: GetActivityPostDto) {
        return this.activityPostService.get(query, token, dto);
    }

    @ServerOperation()
    create(query: IQuery<ActivityPost>, token: string, dto: CreateActivityPostDto) {
        return this.activityPostService.create(query, token, dto);
    }

    @ServerOperation()
    enable(query: IQuery<ActivityPost>, token: string, dto: EnableActivityPostDto) {
        return this.activityPostService.enable(query, token, dto);
    }

    @ServerOperation()
    disable(query: IQuery<ActivityPost>, token: string, dto: DisableActivityPostDto) {
        return this.activityPostService.disable(query, token, dto);
    }

    @ServerOperation()
    like(query: IQuery<ActivityPost>, token: string, dto: LikeActivityPostDto) {
        return this.activityPostService.like(query, token, dto);
    }

    @ServerOperation()
    unlike(query: IQuery<ActivityPost>, token: string, dto: UnlikeActivityPostDto) {
        return this.activityPostService.unlike(query, token, dto);
    }

    @ServerOperation()
    digest(query: IQuery<ActivityPost[]>, token: string, dto: DigestActivityPostDto) {
        return this.activityPostService.digest(query, token, dto);
    }

}
