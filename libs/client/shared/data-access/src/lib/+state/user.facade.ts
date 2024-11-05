import { Injectable } from '@angular/core';
import { RouteService } from '@involvemint/client/shared/routes';
import {
  ChangePasswordDto,
  CreateActivityPostDto,
  CreateChangeMakerProfileDto,
  CreateCommentDto,
  DeleteEpImageDto,
  DeleteOfferImageDto,
  DeleteRequestImageDto,
  DeleteSpImageDto,
  DisplayCommentsDto,
  EditCmProfileDto,
  EditEpProfileDto,
  EditSpProfileDto,
  FlagCommentDto,
  GetActivityPostDto,
  GetSuperAdminForExchangePartnerDto,
  HideCommentDto,
  ImConfig,
  LikeActivityPostDto,
  SignUpDto,
  SubmitEpApplicationDto,
  SubmitSpApplicationDto,
  TransactionDto,
  UnflagCommentDto,
  UnhideCommentDto,
  UnlikeActivityPostDto,
  UpdateOfferDto,
  UpdateRequestDto,
  WalletTabs,
} from '@involvemint/shared/domain';
import { UnArray } from '@involvemint/shared/util';
import { Actions, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs/operators';
import * as CreditsActions from './credits/credits.actions';
import * as CreditsSelectors from './credits/credits.selectors';
import * as MarketActions from './market/market.actions';
import { ExchangePartnerMarketStoreModel } from './market/market.reducer';
import * as MarketSelectors from './market/market.selectors';
import * as OffersActions from './offers/offers.actions';
import { OfferStoreModel } from './offers/offers.reducer';
import * as OffersSelectors from './offers/offers.selectors';
import * as ProjectsActions from './projects/projects.actions';
import * as ProjectsSelectors from './projects/projects.selectors';
import * as RequestsActions from './requests/requests.actions';
import { RequestStoreModel } from './requests/requests.reducer';
import * as RequestsSelectors from './requests/requests.selectors';
import * as CmProfileActions from './session/cm/cm-profile.actions';
import * as EpProfileActions from './session/ep/ep-profile.actions';
import * as SpProfileActions from './session/sp/sp-profile.actions';
import * as UserSessionActions from './session/user-session.actions';
import {
  ActiveProfile,
  EpActiveProfile,
  ExchangeAdminsWithBaDownloaded,
  SpActiveProfile,
  UserSessionState,
  UserStoreModel,
} from './session/user-session.reducer';
import * as UserSessionSelectors from './session/user-session.selectors';
import * as TransactionsActions from './transactions/transactions.actions';
import * as TransactionsSelectors from './transactions/transactions.selectors';
import * as VouchersActions from './vouchers/vouchers.actions';
import * as VouchersSelectors from './vouchers/vouchers.selectors';
import * as PostActions from './activity-posts/activity-posts.actions';
import * as PostSelectors from './activity-posts/activity-posts.selectors';
import * as CommentSelectors from './comments/comments.selectors';
import * as CommentActions from './comments/comments.actions';
import { CommentStoreModel } from './comments/comments.reducer';
import { PostStoreModel } from './activity-posts';

@Injectable()
export class UserFacade {
  readonly cmProfile = {
    dispatchers: {
      editCmProfile: (dto: EditCmProfileDto) => {
        this.store.dispatch(CmProfileActions.editCmProfile({ dto }));
      },
      changeCmProfilePic: (file: File) => {
        this.store.dispatch(CmProfileActions.changeCmProfilePic({ file }));
      },
    },
    actionListeners: {
      editCmProfile: {
        success: this.actions$.pipe(ofType(CmProfileActions.editCmProfileSuccess)),
        error: this.actions$.pipe(ofType(CmProfileActions.editCmProfileError)),
      },
    },
  };

  readonly epProfile = {
    dispatchers: {
      editEpProfile: (changes: EditEpProfileDto['changes']) => {
        this.store.dispatch(EpProfileActions.editEpProfile({ changes }));
      },
      changeEpLogoFile: (file: File) => {
        this.store.dispatch(EpProfileActions.changeEpLogoFile({ file }));
      },
      uploadEpImages: (files: File[]) => {
        this.store.dispatch(EpProfileActions.uploadEpImages({ files }));
      },
      deleteEpImage: (imagesFilePathsIndex: DeleteEpImageDto['imagesFilePathsIndex']) => {
        this.store.dispatch(EpProfileActions.deleteEpImage({ imagesFilePathsIndex }));
      },
    },
    actionListeners: {
      editEpProfile: {
        success: this.actions$.pipe(ofType(EpProfileActions.editEpProfileSuccess)),
        error: this.actions$.pipe(ofType(EpProfileActions.editEpProfileError)),
      },
    },
  };

  readonly spProfile = {
    dispatchers: {
      editSpProfile: (changes: EditSpProfileDto['changes']) => {
        this.store.dispatch(SpProfileActions.editSpProfile({ changes }));
      },
      changeSpLogoFile: (file: File) => {
        this.store.dispatch(SpProfileActions.changeSpLogoFile({ file }));
      },
      uploadSpImages: (files: File[]) => {
        this.store.dispatch(SpProfileActions.uploadSpImages({ files }));
      },
      deleteSpImage: (imagesFilePathsIndex: DeleteSpImageDto['imagesFilePathsIndex']) => {
        this.store.dispatch(SpProfileActions.deleteSpImage({ imagesFilePathsIndex }));
      },
    },
    actionListeners: {
      editSpProfile: {
        success: this.actions$.pipe(ofType(SpProfileActions.editSpProfileSuccess)),
        error: this.actions$.pipe(ofType(SpProfileActions.editSpProfileError)),
      },
    },
  };

  readonly session = {
    dispatchers: {
      login: (id: string, password: string) => {
        this.store.dispatch(UserSessionActions.userLogin({ id, password }));
      },
      loginAdmin: (password: string) => {
        this.store.dispatch(UserSessionActions.adminLogin({ password }));
      },
      signUp: (dto: SignUpDto) => {
        this.store.dispatch(UserSessionActions.userSignUp({ dto }));
      },
      getUserData: () => {
        this.store.dispatch(UserSessionActions.getUserData());
      },
      baDownloadEpAdmin: (dto: GetSuperAdminForExchangePartnerDto) => {
        this.store.dispatch(UserSessionActions.baDownloadEpAdmin({ dto }));
      },
      baRemoveDownloadedEpAdmin: (downloadedEpAdmin: ExchangeAdminsWithBaDownloaded) => {
        this.store.dispatch(UserSessionActions.baRemoveDownloadedEpAdmin({ downloadedEpAdmin }));
      },
      baSubmitEpApplication: (dto: SubmitEpApplicationDto) => {
        this.store.dispatch(UserSessionActions.baSubmitEpApplication({ dto }));
      },
      snoop: (userId: string) => {
        this.store.dispatch(UserSessionActions.snoop({ userId }));
      },
      logout: () => {
        this.store.dispatch(UserSessionActions.userLogOut());
      },
      createCmProfile: (dto: CreateChangeMakerProfileDto) => {
        this.store.dispatch(UserSessionActions.createChangeMakerProfile({ dto }));
      },
      setActiveProfile: (profileId: string) => {
        this.store.dispatch(UserSessionActions.setActiveProfile({ profileId }));
      },
      submitEpApplication: (dto: SubmitEpApplicationDto) => {
        this.store.dispatch(UserSessionActions.submitEpApplication({ dto }));
      },
      withdrawEpApplication: (epApp: UnArray<UserStoreModel['epApplications']>) => {
        this.store.dispatch(UserSessionActions.withdrawEpApplication({ epApp }));
      },
      submitSpApplication: (dto: SubmitSpApplicationDto) => {
        this.store.dispatch(UserSessionActions.submitSpApplication({ dto }));
      },
      withdrawSpApplication: (spApp: UnArray<UserStoreModel['spApplications']>) => {
        this.store.dispatch(UserSessionActions.withdrawSpApplication({ spApp }));
      },

      setLoadingRoute: (route: string) => {
        this.store
          .select(UserSessionSelectors.getState)
          .pipe(take(1))
          .subscribe(({ loadingRoute }) => {
            if (loadingRoute !== route) {
              this.store.dispatch(UserSessionActions.loadingRoute({ route }));
            }
          });
      },
      toggleNavTabs: (on: boolean) => {
        this.store.dispatch(UserSessionActions.toggleNavTabs({ on }));
      },
      toggleSideMenuBehavior: (behavior: UserSessionState['sideMenuBehavior']) => {
        this.store.dispatch(UserSessionActions.sideMenuBehavior({ behavior }));
      },
      toggleWallet: (open: boolean) => {
        this.store
          .select(UserSessionSelectors.getState)
          .pipe(take(1))
          .subscribe(async ({ navTabs }) => {
            if (!navTabs) {
              await this.route.to.wallet.ROOT();
            }
            this.store.dispatch(UserSessionActions.toggleWallet({ open }));
          });
      },
      setWalletTab: (tab: WalletTabs) => {
        this.store.dispatch(UserSessionActions.setWalletTab({ tab }));
      },
      finishJoyride: () => {
        this.store.dispatch(UserSessionActions.finishJoyride());
      },
      payTo: (handleId: string, amount?: number) => {
        this.store.dispatch(UserSessionActions.payTo({ handleId, amount }));
      },
      changePassword: (dto: ChangePasswordDto) => {
        this.store.dispatch(UserSessionActions.changePassword({ dto }));
      },
    },
    selectors: {
      state$: this.store.select(UserSessionSelectors.getState),
      epAdminsWithBaDownloaded$: this.store.select(UserSessionSelectors.getEpAdminsWithBaDownloaded),
      loadingRoute$: this.store.select(UserSessionSelectors.getState).pipe(
        map(({ loadingRoute }) => loadingRoute),
        distinctUntilChanged()
      ),
      authenticated$: this.store.select(UserSessionSelectors.getState).pipe(
        map(({ id }) => !!id),
        distinctUntilChanged()
      ),
      /** Emits current Active Profile and anytime an account switch is detected. */
      activeProfile$: this.store.select(UserSessionSelectors.getActiveProfile).pipe(
        filter((ap) => !!ap),
        map((ap) => ap as NonNullable<ActiveProfile>),
        distinctUntilChanged((a, b) => a.id === b.id)
      ),
      /** Selects the user's ChangeMaker Profile. */
      changeMaker$: this.store.select(UserSessionSelectors.getChangeMaker),
      /** Emits only when the active profile is an EP account. */
      activeProfileEp$: this.store.select(UserSessionSelectors.getActiveProfile).pipe(
        filter((ap) => ap?.type === 'ep'),
        map((activeProfile) => activeProfile as EpActiveProfile),
        debounceTime(0) // Prevent duplicate emits.
      ),
      /** Emits only when the active profile is an SP account. */
      activeProfileSp$: this.store.select(UserSessionSelectors.getActiveProfile).pipe(
        filter((ap) => ap?.type === 'sp'),
        map((activeProfile) => activeProfile as SpActiveProfile),
        debounceTime(0) // Prevent duplicate emits.
      ),
      email$: this.store.select(UserSessionSelectors.getState).pipe(
        map(({ id }) => id),
        distinctUntilChanged()
      ),
      navTabs$: this.store.select(UserSessionSelectors.getState).pipe(
        map(({ navTabs }) => navTabs),
        distinctUntilChanged()
      ),
      isAdmin$: this.store.select(UserSessionSelectors.getState).pipe(
        map(({ id }) => id === ImConfig.adminEmail),
        distinctUntilChanged()
      ),
      sideMenuBehavior$: this.store.select(UserSessionSelectors.getState).pipe(
        map(({ sideMenuBehavior }) => sideMenuBehavior),
        distinctUntilChanged()
      ),
    },
    actionListeners: {
      login: {
        success: this.actions$.pipe(ofType(UserSessionActions.userLoginSuccess)),
        error: this.actions$.pipe(ofType(UserSessionActions.userLoginError)),
      },
      signUp: {
        success: this.actions$.pipe(ofType(UserSessionActions.userSignUpSuccess)),
        error: this.actions$.pipe(ofType(UserSessionActions.userSignUpError)),
      },
      getUserData: {
        success: this.actions$.pipe(ofType(UserSessionActions.getUserDataSuccess)),
        error: this.actions$.pipe(ofType(UserSessionActions.getUserDataError)),
      },
      submitSpApplication: {
        success: this.actions$.pipe(ofType(UserSessionActions.submitSpApplicationSuccess)),
        error: this.actions$.pipe(ofType(UserSessionActions.submitSpApplicationError)),
      },
      submitEpApplication: {
        success: this.actions$.pipe(ofType(UserSessionActions.submitEpApplicationSuccess)),
        error: this.actions$.pipe(ofType(UserSessionActions.submitEpApplicationError)),
      },
      toggleWallet$: this.actions$.pipe(ofType(UserSessionActions.toggleWallet)),
      setWalletTab$: this.actions$.pipe(ofType(UserSessionActions.setWalletTab)),
      payTo$: this.actions$.pipe(ofType(UserSessionActions.payTo)),
      changePassword: {
        success: this.actions$.pipe(ofType(UserSessionActions.changePasswordSuccess)),
        error: this.actions$.pipe(ofType(UserSessionActions.changePasswordError)),
      },
    },
  };

  readonly market = {
    dispatchers: {
      loadMoreExchangePartners: () => {
        this.store.dispatch(MarketActions.exchangePartnersMarketLoad());
      },
      loadMoreOffers: () => {
        this.store.select(MarketSelectors.getOffers).pipe(
          take(1),
          tap(({ pagesLoaded }) => {
            this.store.dispatch(MarketActions.offersMarketLoad({ page: pagesLoaded + 1 }));
          })
        );
      },
      loadMoreRequests: () => {
        this.store.select(MarketSelectors.getRequests).pipe(
          take(1),
          tap(({ pagesLoaded }) => {
            this.store.dispatch(MarketActions.requestsMarketLoad({ page: pagesLoaded + 1 }));
          })
        );
      },
      refresh: () => {
        this.store.dispatch(MarketActions.marketRefresh());
      },
    },
    selectors: {
      exchangePartners$: this.store.select(MarketSelectors.getExchangePartners).pipe(
        distinctUntilChanged((a, b) => a.loaded === b.loaded && a.pagesLoaded === b.pagesLoaded),
        tap(({ loaded }) => {
          if (!loaded) {
            this.store.dispatch(MarketActions.exchangePartnersMarketLoad());
          }
        })
      ),
      getExchangePartner: (epId: string) =>
        this.store.select(MarketSelectors.getExchangePartner(epId)).pipe(
          tap(({ exchangePartner }) => {
            if (!exchangePartner) {
              this.store.dispatch(MarketActions.getOneExchangePartner({ epId }));
            }
          })
        ),
      offers$: this.store.select(MarketSelectors.getOffers).pipe(
        distinctUntilChanged((a, b) => a.loaded === b.loaded && a.pagesLoaded === b.pagesLoaded),
        tap(({ loaded }) => {
          if (!loaded) {
            this.store.dispatch(MarketActions.offersMarketLoad({ page: 1 }));
          }
        })
      ),
      getOffer: (offerId: string) =>
        this.store.select(MarketSelectors.getOffer(offerId)).pipe(
          tap(({ offer }) => {
            if (!offer) {
              this.store.dispatch(MarketActions.getOneOffer({ offerId }));
            }
          })
        ),
      requests$: this.store.select(MarketSelectors.getRequests).pipe(
        distinctUntilChanged((a, b) => a.loaded === b.loaded && a.pagesLoaded === b.pagesLoaded),
        tap(({ loaded }) => {
          if (!loaded) {
            this.store.dispatch(MarketActions.requestsMarketLoad({ page: 1 }));
          }
        })
      ),
      getRequest: (requestId: string) =>
        this.store.select(MarketSelectors.getRequest(requestId)).pipe(
          tap(({ request }) => {
            if (!request) {
              this.store.dispatch(MarketActions.getOneRequest({ requestId }));
            }
          })
        ),
    },
    actionListeners: {
      exchangePartnersMarketLoad: {
        success: this.actions$.pipe(ofType(MarketActions.exchangePartnersMarketLoadSuccess)),
        error: this.actions$.pipe(ofType(MarketActions.exchangePartnersMarketLoadError)),
      },
      offersMarketLoad: {
        success: this.actions$.pipe(ofType(MarketActions.offersMarketLoadSuccess)),
        error: this.actions$.pipe(ofType(MarketActions.offersMarketLoadError)),
      },
      requestsMarketLoad: {
        success: this.actions$.pipe(ofType(MarketActions.requestsMarketLoadSuccess)),
        error: this.actions$.pipe(ofType(MarketActions.requestsMarketLoadError)),
      },
    },
  };

  readonly projects = {
    dispatchers: {
      nextPage: () => {
        this.store.select(ProjectsSelectors.getProjects).pipe(
          take(1),
          tap(({ pagesLoaded }) => {
            this.store.dispatch(ProjectsActions.projectsLoad({ page: pagesLoaded + 1 }));
          })
        );
      },
      refresh: () => {
        this.store.dispatch(ProjectsActions.refreshProjects());
      },
    },
    selectors: {
      projects$: this.store.select(ProjectsSelectors.getProjects).pipe(
        distinctUntilChanged((a, b) => a.loaded === b.loaded && a.pagesLoaded === b.pagesLoaded),
        tap(({ loaded }) => {
          if (!loaded) {
            this.store.dispatch(ProjectsActions.projectsLoad({ page: 1 }));
          }
        })
      ),
      getProject: (projectId: string) =>
        this.store.select(ProjectsSelectors.getProject(projectId)).pipe(
          tap(({ project }) => {
            if (!project) {
              this.store.dispatch(ProjectsActions.getProject({ projectId }));
            }
          })
        ),
    },
  };

  readonly credits = {
    dispatchers: {
      refresh: () =>
        this.session.selectors.activeProfile$.pipe(take(1)).subscribe((profile) => {
          this.store.dispatch(CreditsActions.refreshCreditsForProfile({ profile }));
        }),
    },
    selectors: {
      credits$: this.session.selectors.activeProfile$.pipe(
        switchMap((profile) =>
          this.store.select(CreditsSelectors.getCreditsByProfile(profile)).pipe(
            map(({ credits, profileLoaded, escrowCredits }) => {
              const loaded = profileLoaded.includes(profile.id);
              if (!loaded) {
                this.store.dispatch(CreditsActions.loadCreditsForProfile({ profile }));
              }
              return { credits, loaded, escrowCredits };
            })
          )
        )
      ),
    },
  };

  readonly transactions = {
    dispatchers: {
      refresh: () => {
        this.session.selectors.activeProfile$.pipe(take(1)).subscribe((profile) => {
          this.store.dispatch(TransactionsActions.refreshTransactionsForProfile({ profile }));
        });
      },
      transaction: (dto: Omit<TransactionDto, 'senderHandle'>) => {
        this.session.selectors.activeProfile$.pipe(take(1)).subscribe((profile) => {
          this.store.dispatch(
            TransactionsActions.transaction({
              dto: { ...dto, senderHandle: profile.handle.id },
            })
          );
        });
      },
    },
    actionListeners: {
      transaction: {
        success: this.actions$.pipe(ofType(TransactionsActions.transactionSuccess)),
        error: this.actions$.pipe(ofType(TransactionsActions.transactionError)),
      },
    },
    selectors: {
      transactions$: this.session.selectors.activeProfile$.pipe(
        switchMap((profile) =>
          this.store.select(TransactionsSelectors.getTransactionsByProfile(profile)).pipe(
            map(({ receivedTransactions, sentTransactions, profileLoaded }) => {
              const loaded = profileLoaded.includes(profile.id);
              if (!loaded) {
                this.store.dispatch(TransactionsActions.loadTransactionsForProfile({ profile }));
              }
              return { receivedTransactions, sentTransactions, loaded };
            })
          )
        )
      ),
    },
  };

  readonly offers = {
    dispatchers: {
      refresh: () => {
        this.session.selectors.activeProfile$.pipe(take(1)).subscribe((profile) => {
          this.store.dispatch(OffersActions.refreshOffersForProfile({ profile }));
        });
      },
      /**
       * @param returnToEpStorefront True to route to EP Storefront route, False to route to marketplace
       * route after create
       */
      create: (returnToEpStorefront = false) => {
        this.store.dispatch(OffersActions.createOffer({ returnToEpStorefront }));
      },
      update: (dto: UpdateOfferDto) => {
        this.store.dispatch(OffersActions.updateOffer({ dto }));
      },
      /**
       * @param returnToEpStorefront True to route back to EP Storefront route, False to route back to
       * marketplace route after delete
       */
      delete: (offer: OfferStoreModel, returnToEpStorefront = false) => {
        this.store.dispatch(OffersActions.deleteOffer({ offer, returnToEpStorefront }));
      },
      uploadImages: (offer: OfferStoreModel, images: File[]) => {
        this.store.dispatch(OffersActions.uploadImages({ offer, images }));
      },
      deleteImage: (dto: DeleteOfferImageDto) => {
        this.store.dispatch(OffersActions.deleteImage({ dto }));
      },
    },
    selectors: {
      offers$: this.session.selectors.activeProfile$.pipe(
        switchMap((profile) =>
          this.store.select(OffersSelectors.getOffersByProfile(profile)).pipe(
            map(({ offers, profileLoaded }) => {
              const loaded = profileLoaded.includes(profile.id);
              if (!loaded) {
                this.store.dispatch(OffersActions.loadOffersForProfile({ profile }));
              }
              return { offers, loaded };
            })
          )
        )
      ),
      getOffer: (offerId: string) =>
        this.session.selectors.activeProfile$.pipe(
          switchMap((profile) =>
            this.store.select(OffersSelectors.getOffer(offerId)).pipe(
              map(({ offer, profileLoaded }) => {
                const loaded = profileLoaded.includes(profile.id);
                if (!loaded) {
                  this.store.dispatch(OffersActions.loadOffersForProfile({ profile }));
                }
                return { offer, loaded };
              })
            )
          )
        ),
    },
  };

  readonly requests = {
    dispatchers: {
      refresh: () => {
        this.session.selectors.activeProfile$.pipe(take(1)).subscribe((profile) => {
          this.store.dispatch(RequestsActions.refreshRequestsForProfile({ profile }));
        });
      },
      /**
       * @param returnToEpStorefront True to route to EP Storefront route, False to route to marketplace
       * route after create
       */
      create: (returnToEpStorefront = false) => {
        this.store.dispatch(RequestsActions.createRequest({ returnToEpStorefront }));
      },
      update: (dto: UpdateRequestDto) => {
        this.store.dispatch(RequestsActions.updateRequest({ dto }));
      },
      /**
       * @param returnToEpStorefront True to route back to EP Storefront route, False to route back to
       * marketplace route after delete
       */
      delete: (request: RequestStoreModel, returnToEpStorefront = false) => {
        this.store.dispatch(RequestsActions.deleteRequest({ request, returnToEpStorefront }));
      },
      uploadImages: (request: RequestStoreModel, images: File[]) => {
        this.store.dispatch(RequestsActions.uploadImages({ request, images }));
      },
      deleteImage: (dto: DeleteRequestImageDto) => {
        this.store.dispatch(RequestsActions.deleteImage({ dto }));
      },
    },
    selectors: {
      requests$: this.session.selectors.activeProfile$.pipe(
        switchMap((profile) =>
          this.store.select(RequestsSelectors.getRequestsByProfile(profile)).pipe(
            map(({ requests, profileLoaded }) => {
              const loaded = profileLoaded.includes(profile.id);
              if (!loaded) {
                this.store.dispatch(RequestsActions.loadRequestsForProfile({ profile }));
              }
              return { requests, loaded };
            })
          )
        )
      ),
      getRequest: (requestId: string) =>
        this.session.selectors.activeProfile$.pipe(
          switchMap((profile) =>
            this.store.select(RequestsSelectors.getRequest(requestId)).pipe(
              map(({ request, profileLoaded }) => {
                const loaded = profileLoaded.includes(profile.id);
                if (!loaded) {
                  this.store.dispatch(RequestsActions.loadRequestsForProfile({ profile }));
                }
                return { request, loaded };
              })
            )
          )
        ),
    },
  };

  readonly vouchers = {
    dispatchers: {
      refresh: () =>
        this.session.selectors.activeProfile$.pipe(take(1)).subscribe((profile) => {
          this.store.dispatch(VouchersActions.refreshVouchersForProfile({ profile }));
        }),
      buy: (
        seller: ExchangePartnerMarketStoreModel,
        offers: Array<{ offer: UnArray<ExchangePartnerMarketStoreModel['offers']>; quantity: number }>
      ) => {
        this.store.dispatch(VouchersActions.buyVoucher({ seller, offers }));
      },
    },
    actionListeners: {
      buyVoucher: {
        success: this.actions$.pipe(ofType(VouchersActions.buyVoucherSuccess)),
        error: this.actions$.pipe(ofType(VouchersActions.buyVoucherError)),
      },
    },
    selectors: {
      vouchers$: this.session.selectors.activeProfile$.pipe(
        switchMap((profile) =>
          this.store.select(VouchersSelectors.getVouchersByProfile(profile)).pipe(
            map(({ vouchers, profileLoaded }) => {
              const loaded = profileLoaded.includes(profile.id);
              if (!loaded) {
                this.store.dispatch(VouchersActions.loadVouchersForProfile({ profile }));
              }
              return { vouchers, loaded };
            })
          )
        )
      ),
    },
  };

  readonly posts = {
    dispatchers: {
      loadPosts: () => {
        this.store.pipe(select(PostSelectors.getPosts), take(1)).subscribe((state) => {
          this.store.dispatch(PostActions.loadPosts({ page: state.pagesLoaded + 1, limit: state.limit }));
        });
      },
      get: (dto: GetActivityPostDto) => {
        this.store.dispatch(PostActions.getPost({ dto }));
      },
      create: (dto: CreateActivityPostDto) => {
        this.store.dispatch(PostActions.createPost({ dto }));
      },
      like: (dto: LikeActivityPostDto) => {
        this.store.dispatch(PostActions.like({ dto }));
      },
      unlike: (dto: UnlikeActivityPostDto) => {
        this.store.dispatch(PostActions.unlike({ dto }));
      },
    },
    selectors: {
      posts$: this.store.pipe(select(PostSelectors.getPosts)).pipe(
        tap(({ loaded, limit }) => {
          if (!loaded) {
            this.store.dispatch(PostActions.loadPosts({ page: 1, limit }));
          }
        })
      ),
      getPost: (postId: string) =>
        this.store.pipe(select(PostSelectors.selectPost(postId))).pipe(
          tap(({ loaded, limit }) => {
            if (!loaded) {
              this.store.dispatch(PostActions.loadPosts({ page: 1, limit }));
            }
          })
        ),
    },
    actionListeners: {
      loadPosts: {
        success: this.actions$.pipe(ofType(PostActions.loadPostsSuccess)),
        error: this.actions$.pipe(ofType(PostActions.loadPostsError)),
      },
    }
  }

  readonly comments = {
    dispatchers: {
      loadComments: () => {
        this.store.pipe(select(CommentSelectors.getComments), take(1)).subscribe((state) => {
          this.store.dispatch(CommentActions.loadComments({ page: state.pagesLoaded + 1}));
        });
      },
      initComments: (comments: CommentStoreModel[]) => {
        this.store.pipe(select(CommentSelectors.getComments), take(1)).subscribe((_state) => {
          this.store.dispatch(CommentActions.initComments({ comments: comments}));
        })
      },
      createComment: (dto: CreateCommentDto) => {
        this.store.dispatch(CommentActions.createComment({ dto }));
      },
      flagComment: (dto: FlagCommentDto) => {
        this.store.dispatch(CommentActions.flagComment({ dto }));
      },
      unflagComment: (dto: UnflagCommentDto) => {
        this.store.dispatch(CommentActions.unflagComment({ dto }));
      },
      hideComment: (dto: HideCommentDto) => {
        this.store.dispatch(CommentActions.hideComment({ dto }));
      },
      unhideComment: (dto: UnhideCommentDto) => {
        this.store.dispatch(CommentActions.unhideComment({ dto }));
      },
    },
    selectors: {
      comments$: this.store.select(CommentSelectors.getComments),
      getComment: (commentId: string) =>
        this.store.pipe(select(CommentSelectors.getComment(commentId))).pipe(
          tap(({ loaded }) => {
            if (!loaded) {
              this.store.dispatch(CommentActions.loadComments({ page: 1 }));
            }
          })
        ),
    },
    actionListeners: {
      loads: {
        success: this.actions$.pipe(ofType(CommentActions.loadCommentsSuccess)),
        error: this.actions$.pipe(ofType(CommentActions.loadCommentsError)),
      }
    }
  }

  constructor(
    private readonly store: Store,
    private readonly actions$: Actions,
    private readonly route: RouteService
  ) {}
}
