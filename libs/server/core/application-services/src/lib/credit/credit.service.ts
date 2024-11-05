import { CreditRepository, HandleRepository } from '@involvemint/server/core/domain-services';
import {
  calculateTotalCreditsAmount,
  calculateTotalEscrowAmount,
  Credit,
  GetCreditsForProfileDto,
  MintDto,
} from '@involvemint/shared/domain';
import { isDecimal } from '@involvemint/shared/util';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createQuery, IParser, IQuery } from '@orcha/common';
import { compareAsc } from 'date-fns';
import * as uuid from 'uuid';
import { AuthService } from '../auth/auth.service';

export const CreditQuery = createQuery<Credit>()({
  id: true,
  escrow: true,
  amount: true,
  dateMinted: true,
  changeMaker: { id: true },
  exchangePartner: { id: true },
  servePartner: { id: true },
  poi: { id: true },
});

export type CreditStoreModel = IParser<Credit, typeof CreditQuery>;

@Injectable()
export class CreditService {
  constructor(
    private readonly creditRepo: CreditRepository,
    private readonly auth: AuthService,
    private readonly handle: HandleRepository
  ) {}

  async getCreditsForProfile(query: IQuery<Credit>, token: string, dto: GetCreditsForProfileDto) {
    await this.auth.authenticateFromProfileId(dto.profileId, token);

    return this.creditRepo.query(query, {
      where: [
        { changeMaker: dto.profileId },
        { servePartner: dto.profileId },
        { exchangePartner: dto.profileId },
      ],
    });
  }

  /**
   * Admin only.
   */
  async mint(_: IQuery<Record<string, never>>, token: string, dto: MintDto) {
    await this.auth.validateAdminToken(token);
    const handle = await this.handle.findOneOrFail(dto.handle, {
      id: true,
      changeMaker: { id: true },
      servePartner: { id: true },
      exchangePartner: { id: true },
    });
    await this.creditRepo.upsert({
      id: uuid.v4(),
      amount: dto.amount,
      dateMinted: new Date(),
      escrow: false,
      poi: null,
      changeMaker: handle.changeMaker ? handle.changeMaker.id : null,
      servePartner: handle.servePartner ? handle.servePartner.id : null,
      exchangePartner: handle.exchangePartner ? handle.exchangePartner.id : null,
    });
    return {};
  }

  /**
   * Transfers user's credits into Escrow.
   * @param profileId user's profile ID
   * @param amount
   */
  transferCreditsInToEscrow(profileId: string, amount: number) {
    return this.escrowTransfer(profileId, amount, true);
  }

  /**
   * Transfers user's credits out of Escrow.
   * @param profileId user's profile ID
   * @param amount
   */
  transferCreditsOutOfEscrow(profileId: string, amount: number) {
    return this.escrowTransfer(profileId, amount, false);
  }

  /**
   * Transfers credits either into or out of Escrow depending on the `intoEscrow` flag.
   * @param profileId user's profile ID
   * @param amount
   * @param intoEscrow True if transferring credits into Escrow, false if transferring credits out of Escrow.
   */
  private async escrowTransfer(profileId: string, amount: number, intoEscrow: boolean) {
    if (amount === 0 || isDecimal(amount)) {
      throw new InternalServerErrorException('Amount must be an non-zero integer.');
    }

    /** Current user's credits. */
    const credits = await this.creditRepo.query(CreditQuery, {
      where: [{ changeMaker: profileId }, { servePartner: profileId }, { exchangePartner: profileId }],
    });

    // Sort credits by smallest to largest amount.
    // This is so we don't unnecessarily split a large credit when smaller ones are present.
    credits.sort((a, b) => compareAsc(a.amount, b.amount));

    if (
      (intoEscrow && calculateTotalCreditsAmount(credits) < amount) ||
      (!intoEscrow && calculateTotalEscrowAmount(credits) < amount)
    ) {
      throw new InternalServerErrorException('Insufficient credits to process transaction.');
    }

    /** Amount transferred currently in queue. */
    let amountTransferred = 0;

    /** Update queue for Credits to be updated in DB. */
    const queue: CreditStoreModel[] = [];

    for (const credit of credits) {
      // If transferring into Escrow -> ignore Credit's currently in Escrow.
      if (intoEscrow && credit.escrow) continue;
      // If transferring out of Escrow -> ignore Credit's currently not in Escrow.
      if (!intoEscrow && !credit.escrow) continue;

      /** Amount left to transfer (amount that still needs to be placed in `queue`). */
      const amountLeft = amount - amountTransferred;

      // If current credit's amount is <= `amountLeft` then put that credit into Escrow.
      if (credit.amount <= amountLeft) {
        amountTransferred += credit.amount;
        queue.push({ ...credit, escrow: intoEscrow });

        // Break loop if enough credits in the queue; we're done here.
        if (amountTransferred === amount) break;
      } else {
        // If the current credit is greater than `amountLeft`,
        // then split difference with the creation of new credit and the current credit.
        queue.push({ ...credit, id: uuid.v4(), amount: amountLeft, escrow: intoEscrow });
        queue.push({ ...credit, amount: credit.amount - amountLeft });

        // Loop will always break here since the difference is split between current credit and new credit.
        break;
      }
    }

    return this.creditRepo.upsertMany(queue);
  }
}
