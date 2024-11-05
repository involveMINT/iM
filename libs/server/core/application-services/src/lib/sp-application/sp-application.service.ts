import {
    HandleRepository,
    ServePartnerRepository,
    SpApplicationRepository,
  } from '@involvemint/server/core/domain-services';
  import {
    environment,
    ImConfig,
    ProcessSpApplicationDto,
    SpApplication,
    SubmitSpApplicationDto,
    WithdrawSpApplicationDto,
  } from '@involvemint/shared/domain';
  import { Injectable, UnauthorizedException } from '@nestjs/common';
  import { IQuery, parseQuery } from '@orcha/common';
  import * as geocoder from 'node-geocoder';
  import { Socket } from 'socket.io';
  import * as uuid from 'uuid';
  import { AuthService } from '../auth/auth.service';
  import { EmailService } from '../email/email.service';
  import { DbTransactionCreator } from '../transaction-creator/transaction-creator.service';
  
  @Injectable()
  export class SpApplicationService {
    readonly subs = {
      handleDisconnect: (client: Socket) => {
        this.spAppRepo.subscriptions.onDisconnect(client);
      },
      subAll: async (socket: Socket, channel: string, query: IQuery<SpApplication[]>, token: string) => {
        await this.auth.validateAdminToken(token);
        return this.spAppRepo.subscriptions.querySubscription(socket, channel, query);
      },
    };
  
    constructor(
      private readonly spAppRepo: SpApplicationRepository,
      private readonly auth: AuthService,
      private readonly dbTransact: DbTransactionCreator,
      private readonly sp: ServePartnerRepository,
      private readonly handle: HandleRepository,
      private readonly email: EmailService
    ) {}
  
    async submit(query: IQuery<SpApplication>, dto: SubmitSpApplicationDto, token: string) {
      const user = await this.auth.validateUserToken(token);
  
      await this.handle.verifyHandleUniqueness(dto.handle);
  
      const spAppId = uuid.v4();
  
      const spApp = await this.spAppRepo.upsert(
        {
          id: spAppId,
          handle: { id: dto.handle },
          user,
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
        return spApp;
      }
  
      await this.process({}, { allow: true, id: spAppId }, '', false);
      return spApp;
    }
  
    async process(
      query: IQuery<{ deletedId: string }>,
      dto: ProcessSpApplicationDto,
      token: string,
      auth = true
    ) {
      if (auth) {
        await this.auth.validateAdminToken(token);
      }
  
      const spApp = await this.spAppRepo.findOneOrFail(dto.id, {
        address: { id: true },
        email: true,
        name: true,
        id: true,
        phone: true,
        website: true,
        handle: { id: true },
        user: { id: true, changeMaker: { firstName: true } },
      });
  
      const geo = geocoder.default({ provider: 'google', apiKey: environment.gcpApiKey });
      const res = await geo.geocode(Object.entries(spApp.address).join(' '));
  
      const lat = Number(res[0]?.latitude?.toFixed(4));
      const lng = Number(res[0]?.longitude?.toFixed(4));
  
      await this.dbTransact.run(async () => {
        await this.spAppRepo.delete(dto.id);
        if (dto.allow) {
          await this.sp.upsert({
            ...spApp,
            latitude: isNaN(lat) ? undefined : lat,
            longitude: isNaN(lng) ? undefined : lng,
            address: spApp.address.id,
            dateCreated: new Date(),
            projects: [],
            imagesFilePaths: [],
            offers: [],
            requests: [],
            admins: [
              {
                id: uuid.v4(),
                datePermitted: new Date(),
                superAdmin: true,
                user: spApp.user.id,
              },
            ],
            credits: [],
            receivingTransactions: [],
            sendingTransactions: [],
            receivingVouchers: [],
          });
        }
      });
  
      await this.email.sendInfoEmail({
        message: dto.allow
          ? `Congratulations! You're application for ${spApp.name} has been approved! This means you can now login as a ExchangeAdmin of the account and begin creating Projects. To do this, To do this, login to the app and choose your business's name in the ServePartner's slide in the app's entry point slides.`
          : `We're sorry. Your ServePartner application for ${spApp.name} has been denied. This means that you either provided insufficient information to verify that you are the owner of the business or that it was flagged as spam. Please contact info@involvemint.io if you believe this was a mistake.`,
        subject: 'ServePartner Application Update',
        user: spApp.user.changeMaker?.firstName ?? spApp.user.id,
        email: spApp.user.id,
      });
  
      return parseQuery(query, { deletedId: dto.id });
    }
  
    async findAll(query: IQuery<SpApplication>, token: string) {
      await this.auth.validateAdminToken(token);
      return this.spAppRepo.findAll(query);
    }
  
    async withdraw(query: IQuery<{ deletedId: string }>, token: string, dto: WithdrawSpApplicationDto) {
      const user = await this.auth.validateUserToken(token);
      const epApp = await this.spAppRepo.findOneOrFail(dto.spAppId, { user: { id: true } });
  
      if (user.id !== epApp.user.id) {
        throw new UnauthorizedException('You do not own this ServePartner Application.');
      }
  
      return parseQuery(query, { deletedId: await this.spAppRepo.delete(dto.spAppId) });
    }
  }