import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { InfoModalModule } from '@involvemint/client/shared/util';
import { IonicModule } from '@ionic/angular';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { OrchaModule } from '@orcha/angular';
import { PostEffects, PostsReducer, POSTS_KEY } from './+state/activity-posts';
import { CreditsEffects } from './+state/credits/credits.effects';
import { CreditReducer, CREDITS_KEY } from './+state/credits/credits.reducer';
import { ProjectsEffects } from './+state/market/market.effects';
import { MarketReducer, MARKET_KEY } from './+state/market/market.reducer';
import { OffersEffects } from './+state/offers/offers.effects';
import { OfferReducer, OFFERS_KEY } from './+state/offers/offers.reducer';
import { MarketEffects } from './+state/projects/projects.effects';
import { ProjectsReducer, PROJECTS_KEY } from './+state/projects/projects.reducer';
import { RequestsEffects } from './+state/requests/requests.effects';
import { RequestReducer, REQUESTS_KEY } from './+state/requests/requests.reducer';
import { CmProfileEffects } from './+state/session/cm/cm-profile.effects';
import { EpProfileEffects } from './+state/session/ep/ep-profile.effects';
import { SpProfileEffects } from './+state/session/sp/sp-profile.effects';
import { UserSessionEffects } from './+state/session/user-session.effects';
import { UserSessionReducer, USER_SESSION_KEY } from './+state/session/user-session.reducer';
import { TransactionsEffects } from './+state/transactions/transactions.effects';
import { TransactionsReducer, TRANSACTIONS_KEY } from './+state/transactions/transactions.reducer';
import { UserFacade } from './+state/user.facade';
import { ConfirmVoucherPurchaseModalModule } from './+state/vouchers/confirm-voucher-purchase-modal/confirm-voucher-purchase-modal.module';
import { VouchersEffects } from './+state/vouchers/vouchers.effects';
import { VoucherReducer, VOUCHERS_KEY } from './+state/vouchers/vouchers.reducer';
import { AuthInterceptor } from './auth.interceptor';
import { EpApplicationGateway } from './gateways/ep-application.gateway';
import { SpApplicationGateway } from './gateways/sp-application.gateway';
import { ImProfileSelectModalModule } from './modals/im-profile-select-modal/im-profile-select-modal.module';
import {
  ActivityPostOrchestration,
  ChangeMakerOrchestration,
  ChatOrchestration,
  CommentOrchestration,
  CreditOrchestration,
  EnrollmentOrchestration,
  EpApplicationOrchestration,
  ExchangeAdminOrchestration,
  ExchangePartnerOrchestration,
  HandleOrchestration,
  PassportDocumentOrchestration,
  ProjectOrchestration,
  ServeAdminOrchestration,
  SpApplicationOrchestration,
  TransactionOrchestration,
  UserOrchestration,
  VoucherOrchestration,
} from './orchestrations';
import { OfferOrchestration } from './orchestrations/offer.orchestration';
import { PoiOrchestration } from './orchestrations/poi.orchestration';
import { RequestOrchestration } from './orchestrations/request.orchestration';
import { ServePartnerOrchestration } from './orchestrations/serve-partner.orchestration';
import { StorageOrchestration } from './orchestrations/storage.orchestration';
import { COMMENTS_KEY, CommentsReducer } from './+state/comments/comments.reducer';
import { CommentEffects } from './+state/comments/comments.effects';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    InfoModalModule,
    ImProfileSelectModalModule,
    ConfirmVoucherPurchaseModalModule,
    StoreModule.forFeature(CREDITS_KEY, CreditReducer),
    StoreModule.forFeature(MARKET_KEY, MarketReducer),
    StoreModule.forFeature(OFFERS_KEY, OfferReducer),
    StoreModule.forFeature(POSTS_KEY, PostsReducer),
    StoreModule.forFeature(PROJECTS_KEY, ProjectsReducer),
    StoreModule.forFeature(REQUESTS_KEY, RequestReducer),
    StoreModule.forFeature(TRANSACTIONS_KEY, TransactionsReducer),
    StoreModule.forFeature(USER_SESSION_KEY, UserSessionReducer),
    StoreModule.forFeature(VOUCHERS_KEY, VoucherReducer),
    StoreModule.forFeature(COMMENTS_KEY, CommentsReducer),
    EffectsModule.forFeature([
      CmProfileEffects,
      CreditsEffects,
      CommentEffects,
      EpProfileEffects,
      MarketEffects,
      OffersEffects,
      PostEffects,
      ProjectsEffects,
      RequestsEffects,
      SpProfileEffects,
      TransactionsEffects,
      UserSessionEffects,
      VouchersEffects,
      CommentEffects,
    ]),
    OrchaModule.forFeature({
      orchestrations: [
        ActivityPostOrchestration,
        ChangeMakerOrchestration,
        ChatOrchestration,
        CommentOrchestration,
        CreditOrchestration,
        EnrollmentOrchestration,
        EpApplicationOrchestration,
        ExchangeAdminOrchestration,
        ExchangePartnerOrchestration,
        HandleOrchestration,
        OfferOrchestration,
        PassportDocumentOrchestration,
        PoiOrchestration,
        ProjectOrchestration,
        RequestOrchestration,
        ServeAdminOrchestration,
        ServePartnerOrchestration,
        SpApplicationOrchestration,
        StorageOrchestration,
        TransactionOrchestration,
        UserOrchestration,
        VoucherOrchestration,
      ],
      gateways: [EpApplicationGateway, SpApplicationGateway],
      interceptors: [AuthInterceptor],
    }),
  ],
  providers: [UserFacade, AuthInterceptor],
})
export class ClientSharedDataAccessModule {}
