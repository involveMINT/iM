import { IOperation } from '@orcha/common';
import { GetCreditsForProfileDto, MintDto } from './credit.dtos';
import { Credit } from './credit.model';

export interface ICreditOrchestration {
  getCreditsForProfile: IOperation<Credit[], GetCreditsForProfileDto>;
  mint: IOperation<Record<string, never>, MintDto>;
}
