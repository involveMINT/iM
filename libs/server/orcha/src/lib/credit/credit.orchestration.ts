import { CreditService } from '@involvemint/server/core/application-services';
import {
  Credit,
  CreditQuery,
  GetCreditsForProfileDto,
  ICreditOrchestration,
  InvolvemintOrchestrations,
  MintDto,
} from '@involvemint/shared/domain';
import { IQuery } from '@orcha/common';
import { IServerOrchestration, ServerOperation, ServerOrchestration } from '@orcha/nestjs';

@ServerOrchestration(InvolvemintOrchestrations.credit)
export class CreditOrchestration implements IServerOrchestration<ICreditOrchestration> {
  constructor(private readonly credit: CreditService) {}

  @ServerOperation({ validateQuery: CreditQuery })
  getCreditsForProfile(query: IQuery<Credit>, token: string, dto: GetCreditsForProfileDto) {
    return this.credit.getCreditsForProfile(query, token, dto);
  }

  @ServerOperation()
  mint(query: IQuery<Record<string,never>>, token: string, dto: MintDto) {
    return this.credit.mint(query, token, dto);
  }
}
