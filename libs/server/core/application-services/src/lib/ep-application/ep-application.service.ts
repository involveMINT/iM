import {
  EpApplicationRepository,
  ExchangePartnerRepository,
  HandleRepository,
} from '@involvemint/server/core/domain-services';
import {
  apiEnvironment,
  BaSubmitEpApplicationDto,
  defaultStorefrontListingStatus,
  environment,
  EpApplication,
  EpOnboardingState,
  ExchangePartner,
  ImConfig,
  ProcessEpApplicationDto,
  SubmitEpApplicationDto,
  WithdrawEpApplicationDto,
} from '@involvemint/shared/domain';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { IQuery, parseQuery } from '@orcha/common';
import { addMonths } from 'date-fns';
import * as geocoder from 'node-geocoder';
import { Socket } from 'socket.io';
import * as uuid from 'uuid';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { DbTransactionCreator } from '../transaction-creator/transaction-creator.service';
import { UserService } from '../user/user.service';

@Injectable()
export class EpApplicationService {
  readonly subs = {
    handleDisconnect: (client: Socket) => {
      this.epAppRepo.subscriptions.onDisconnect(client);
    },

    subAll: async (socket: Socket, channel: string, token: string, query: IQuery<EpApplication[]>) => {
      await this.auth.validateAdminToken(token);
      return this.epAppRepo.subscriptions.querySubscription(socket, channel, query);
    },
  };

  constructor(
    private readonly epAppRepo: EpApplicationRepository,
    private readonly auth: AuthService,
    private readonly dbTransact: DbTransactionCreator,
    private readonly ep: ExchangePartnerRepository,
    private readonly handle: HandleRepository,
    private readonly email: EmailService,
    private readonly userService: UserService
  ) {}

  async submit(query: IQuery<EpApplication>, token: string, dto: SubmitEpApplicationDto) {
    const user = await this.auth.validateUserToken(token);
    await this.handle.verifyHandleUniqueness(dto.handle);
    const epAppId = uuid.v4();
    const epApp = await this.epAppRepo.upsert(
      {
        id: epAppId,
        handle: { id: dto.handle },
        user,
        ein: dto.ein,
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        website: dto.website,
        dateCreated: new Date(),
        address: {
          id: uuid.v4(),
          address1: dto.address1,
          address2: dto.address2,
          city: dto.city,
          state: dto.state,
          zip: dto.zip,
        },
      },
      query
    );

    if (ImConfig.requireApplicationApproval) {
      return epApp;
    }

    await this.process({}, '', { allow: true, id: epAppId }, false);
    return epApp;
  }

  // BA only
  async baSubmit(query: IQuery<ExchangePartner>, token: string, dto: BaSubmitEpApplicationDto) {
    const user = await this.auth.validateUserToken(token);
    if (!user.baAdmin) {
      throw new HttpException(
        `Unauthorized to create an EP account for businesses as you are not a Business Admin`,
        HttpStatus.UNAUTHORIZED
      );
    }

    await this.handle.verifyHandleUniqueness(dto.handle);
    const epAppId = uuid.v4();
    // epAppId is eventually used as epId when processing EP Applications, pass this to baSignUp to be
    // emailed to the user to update EP information such as listStoreFront status on activateUserAccount
    const newUser = await this.userService.baSignUp(
      user.changeMaker ? `${user.changeMaker.firstName} ${user.changeMaker.lastName}` : undefined,
      user.id,
      dto.email,
      epAppId
    );
    await this.epAppRepo.upsert({
      id: epAppId,
      handle: { id: dto.handle },
      user: newUser.id,
      ein: dto.ein,
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      website: dto.website,
      dateCreated: new Date(),
      address: {
        id: uuid.v4(),
        address1: dto.address1,
        address2: dto.address2,
        city: dto.city,
        state: dto.state,
        zip: dto.zip,
      },
    });

    await this.process({}, '', { allow: true, id: epAppId }, false, true);

    await this.email.sendInfoEmail({
      email: user.id,
      user: user.changeMaker?.firstName,
      subject: `New ExchangePartner for Business Created`,
      message: `This email is to confirm the ExchangePartner user creation action made by you as an 
                BusinessAdmin. An email has been sent to ${dto.email} for the business owner to activate
                the account and create a password. The same email has also been cc'd to you in case the
                business owner can no longer retrieve the activation email.
                
                Thank you for creating an ExchangePartner account for ${dto.name}!`,
    });

    return this.ep.findOneOrFail(epAppId, query);
  }

  // Admin only
  async process(
    query: IQuery<{ deletedId: string }>,
    token: string,
    dto: ProcessEpApplicationDto,
    auth = true,
    baAdminCreate = false
  ) {
    if (auth) {
      await this.auth.validateAdminToken(token);
    }

    const epApp = await this.epAppRepo.findOneOrFail(dto.id, {
      address: {
        id: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
      },
      ein: true,
      email: true,
      name: true,
      id: true,
      phone: true,
      website: true,
      handle: { id: true },
      user: { id: true, changeMaker: { firstName: true } },
    });

    const geo = geocoder.default({ provider: 'google', apiKey: apiEnvironment.gcpApiKey });
    const res = await geo.geocode(Object.entries(epApp.address).join(' '));

    const lat = Number(res[0]?.latitude?.toFixed(4));
    const lng = Number(res[0]?.longitude?.toFixed(4));

    await this.dbTransact.run(async () => {
      await this.epAppRepo.delete(dto.id);
      if (dto.allow) {
        // create new EP with EP Application data, INCLUDING re-use EP Application Id as new EP Id.
        // baSubmit() depends on this, check and change necessary logic for that if this is ever modified.
        await this.ep.upsert({
          ...epApp,
          budgetEndDate: addMonths(new Date(), 1),
          listStoreFront: baAdminCreate ? 'private' : defaultStorefrontListingStatus,
          imagesFilePaths: [],
          dateCreated: new Date(),
          budget: ImConfig.startingSpBudget,
          latitude: isNaN(lat) ? undefined : lat,
          longitude: isNaN(lng) ? undefined : lng,
          offers: [],
          requests: [],
          address: epApp.address,
          onboardingState: EpOnboardingState.profile,
          admins: [
            {
              id: uuid.v4(),
              datePermitted: new Date(),
              superAdmin: true,
              user: epApp.user.id,
            },
          ],
          credits: [],
          receivingTransactions: [],
          sendingTransactions: [],
          receivingVouchers: [],
          sendingVouchers: [],
          view: null,
        });
      }
    });

    await this.email.sendInfoEmail({
      message: dto.allow
        ? `Congratulations! You're application for ${epApp.name} has been approved! This means you can now login as a ExchangeAdmin of the account and begin creating Projects. To do this, login to the app and choose your business's name in the ExchangePartner's slide in the app's entry point slides.`
        : `We're sorry. Your ExchangePartner application for ${epApp.name} has been denied. This means that you either provided insufficient information to verify that you are the owner of the business or that it was flagged as spam. Please contact info@involvemint.io if you believe this was a mistake.`,
      subject: 'ExchangePartner Application Update',
      user: epApp.user.changeMaker?.firstName ?? epApp.user.id,
      email: epApp.user.id,
    });

    return parseQuery(query, { deletedId: dto.id });
  }

  async findAll(query: IQuery<EpApplication>, token: string) {
    await this.auth.validateAdminToken(token);
    return this.epAppRepo.findAll(query);
  }

  async withdraw(query: IQuery<{ deletedId: string }>, token: string, dto: WithdrawEpApplicationDto) {
    const user = await this.auth.validateUserToken(token);
    const epApp = await this.epAppRepo.findOneOrFail(dto.epAppId, { user: { id: true } });

    if (user.id !== epApp.user.id) {
      throw new UnauthorizedException('You do not own this ExchangePartner Application.');
    }

    return parseQuery(query, { deletedId: await this.epAppRepo.delete(dto.epAppId) });
  }
}
