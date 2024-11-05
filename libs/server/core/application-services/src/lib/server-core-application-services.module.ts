import { ServerCoreDomainServicesModule } from '@involvemint/server/core/domain-services';
import { FRONTEND_ROUTES_TOKEN, ImRoutes } from '@involvemint/shared/domain';
import { routesFactory } from '@involvemint/shared/util';
import { Global, HttpModule, Module, Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ActivityPostService } from './activity-post/activity-post.service';
import { AppInitService } from './app-init/app-init.service';
import { AuthService } from './auth/auth.service';
import { ChangeMakerService } from './change-maker/change-maker.service';
import { ChatService } from './chat/chat.service';
import { CommentService } from './comment/comment.service';
import { CreditService } from './credit/credit.service';
import { EmailService } from './email/email.service';
import { EnrollmentService } from './enrollment/enrollment.service';
import { EpApplicationService } from './ep-application/ep-application.service';
import { ExchangeAdminService } from './exchange-admin/exchange-admin.service';
import { ExchangePartnerCronService } from './exchange-partner/exchange-partner.cron';
import { ExchangePartnerService } from './exchange-partner/exchange-partner.service';
import { FirestoreService } from './firestore/firestore.service';
import { HandleService } from './handle/handle.service';
import { OfferService } from './offer/offer.service';
import { PassportService } from './passport/passport.service';
import { PoiService } from './poi/poi.service';
import { ProjectService } from './project/project.service';
import { RequestService } from './request/request.service';
import { ServeAdminService } from './serve-admin/serve-admin.service';
import { ServePartnerService } from './serve-partner/serve-partner.service';
import { SMSService } from './sms/sms.service';
import { SpApplicationService } from './sp-application/sp-application.service';
import { StorageService } from './storage/storage.service';
import { DbTransactionCreator } from './transaction-creator/transaction-creator.service';
import { TransactionService } from './transaction/transaction.service';
import { UserService } from './user/user.service';
import { VoucherService } from './voucher/voucher.service';

const services: Provider[] = [
  {
    provide: FRONTEND_ROUTES_TOKEN,
    useValue: routesFactory(ImRoutes),
  },
  ActivityPostService,
  AppInitService,
  AuthService,
  ChangeMakerService,
  ChatService,
  CommentService,
  CreditService,
  DbTransactionCreator,
  EmailService,
  EnrollmentService,
  EpApplicationService,
  ExchangeAdminService,
  ExchangePartnerCronService,
  ExchangePartnerService,
  FirestoreService,
  HandleService,
  OfferService,
  PassportService,
  SMSService,
  PoiService,
  ProjectService,
  RequestService,
  ServeAdminService,
  ServePartnerService,
  SpApplicationService,
  StorageService,
  TransactionService,
  UserService,
  VoucherService,
];

@Global()
@Module({
  imports: [
    HttpModule,
    ServerCoreDomainServicesModule,
    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '14d' },
    }),
  ],
  providers: services,
  exports: services,
})
export class ServerCoreApplicationServicesModule {}
