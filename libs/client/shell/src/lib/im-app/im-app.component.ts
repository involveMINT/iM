import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationCancel, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { ClientCmApiService } from '@involvemint/client/cm/api';
import {
  ActiveProfile,
  ChatService,
  CmActiveProfile,
  EpActiveProfile,
  ImUserSearchModalService,
  setImPrimaryColors,
  SpActiveProfile,
  UserFacade,
  UserSessionState,
} from '@involvemint/client/shared/data-access';
import { RouteService } from '@involvemint/client/shared/routes';
import { ImPopoverComponent, ImPopoverInput, ImPopoverOutput } from '@involvemint/client/shared/ui';
import { InfoModalService, PopoverService, StatefulComponent } from '@involvemint/client/shared/util';
import {
  EpOnboardingState,
  getUnreadMessagesCount,
  ImConfig,
  IM_ACTIVE_PROFILE_QUERY_PARAM,
  WalletTabs,
} from '@involvemint/shared/domain';
import { getQueryStringValue, tapOnce } from '@involvemint/shared/util';
import { AnimationController, IonFab, MenuController } from '@ionic/angular';
import { animationFrameScheduler, combineLatest, EMPTY } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import pkg from '../../../../../../package.json';
import { ImWelcomeModalService } from '../im-welcome-modal/im-welcome-modal.service';

const AP = IM_ACTIVE_PROFILE_QUERY_PARAM;

interface MenuItem {
  title: string;
  subtitle?: string;
  icon: string;
  route?: string;
  click?: () => unknown;
  color?: string;
  isActiveRoute?: boolean;
  uponActivation?: () => unknown;
  loading?: boolean;
  inMenu: boolean;
  inTabs: boolean;
}

interface Menu {
  title: string;
  subtitle?: string;
  items: MenuItem[];
  color: string;
  icon?: string;
  uponActivation?: () => unknown;
  active: boolean;
  profile?: SpActiveProfile | CmActiveProfile | EpActiveProfile;
}

interface State {
  menus: Menu[];
  selectBusinessProfile: Menu | null;
  selectedRoute: string;
  authenticated: boolean;
  email: string;
  settings: Menu;
  activeProfile: ActiveProfile;
  navTabs: boolean;
  walletShown: boolean;
  profilesMenuOpen: boolean;
  sideMenuBehavior: UserSessionState['sideMenuBehavior'];
  onboarding: 'cm' | 'ep' | 'mkt' | null;
  changeMaker: UserSessionState['changeMaker'] | null;
}

@Component({
  selector: 'involvemint-im-app',
  templateUrl: './im-app.component.html',
  styleUrls: ['./im-app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('walletOpenClose', [
      state('open', style({ opacity: 0 })),
      state('close', style({ opacity: 1 })),
      transition('close => open', [animate('250ms ease-in-out')]),
      transition('open => close', [animate('250ms ease-in-out')]),
    ]),
    trigger('menuItemsExpandCollapse', [
      state('in', style({ height: '*', overflow: 'hidden' })),
      state('out', style({ opacity: '1', height: '0px', overflow: 'hidden' })),
      transition('out => in', animate('250ms ease-in-out')),
      transition('in => out', animate('250ms ease-in-out')),
    ]),
    trigger('wallet', [
      transition(':enter', [style({ opacity: 0 }), animate('250ms ease-in-out', style({ opacity: 1 }))]),
      transition(':leave', [style({ opacity: 1 }), animate('250ms ease-in-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class ImAppComponent extends StatefulComponent<State> implements OnInit {
  selectedIndex = 0;

  version: string = pkg.version;

  @ViewChild(IonFab, { read: ElementRef }) readonly walletFab?: ElementRef;

  backDrop!: HTMLDivElement;

  readonly height = ImConfig.walletHeight;

  readonly unreadMessages$ = combineLatest([
    this.user.session.selectors.activeProfile$,
    this.chatService.store$,
  ]).pipe(map(([activeProfile, store]) => getUnreadMessagesCount(activeProfile.handle.id, store.myChats)));

  constructor(
    private readonly user: UserFacade,
    public readonly route: RouteService,
    private readonly router: Router,
    private readonly menu: MenuController,
    private readonly animationCtrl: AnimationController,
    private readonly render: Renderer2,
    private readonly infoModal: InfoModalService,
    private readonly usersSearch: ImUserSearchModalService,
    private readonly popover: PopoverService,
    private readonly welcome: ImWelcomeModalService,
    private readonly cmApi: ClientCmApiService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly chatService: ChatService
  ) {
    super({
      selectedRoute: '',
      menus: [],
      selectBusinessProfile: null,
      email: '',
      authenticated: false,
      activeProfile: { type: 'none', id: '', handle: { id: '' } },
      settings: {
        color: '',
        active: false,
        title: 'Preferences',
        items: [
          {
            icon: 'cog',
            route: route.rawRoutes.path.settings.ROOT,
            title: 'Preferences',
            uponActivation: () => setImPrimaryColors('none'),
            click: () => route.to.settings.ROOT(),
            color: 'var(--im-green)',
            inMenu: false,
            inTabs: false,
          },
        ],
      },
      navTabs: false,
      walletShown: false,
      onboarding: null,
      sideMenuBehavior: 'hidden',
      changeMaker: null,
      profilesMenuOpen: false,
    });
  }

  ngOnInit() {
    this.listenOnboardingActions();
    this.showPopUpOnTransaction();
    this.showPopUpOnVoucherBuy();
    this.listenSideMenuToggleAction();
    this.listenToToggleWalletAction();
    this.generateMainMenu();
  }

  private listenSideMenuToggleAction() {
    this.effect(() =>
      this.user.session.selectors.sideMenuBehavior$.pipe(
        tap((sideMenuBehavior) => this.updateState({ sideMenuBehavior }))
      )
    );
  }

  private listenToToggleWalletAction() {
    this.effect(() =>
      this.user.session.actionListeners.toggleWallet$.pipe(
        tap(({ open }) => {
          // No nav tabs, no wallet.
          if (!this.state.navTabs) {
            return;
          }
          if (open === true && !this.state.walletShown) {
            this.toggleWallet();
          } else if (open === false && this.state.walletShown) {
            this.toggleWallet();
          }
        })
      )
    );
  }

  private generateMainMenu() {
    this.effect(() =>
      this.user.session.selectors.state$.pipe(
        distinctUntilChanged((a, b) => {
          // Only refresh menu if criteria is met.
          return (
            a.epApplications.length +
              a.spApplications.length +
              a.exchangeAdmins.length +
              a.serveAdmins.length ===
              b.epApplications.length +
                b.spApplications.length +
                b.exchangeAdmins.length +
                b.serveAdmins.length &&
            a.navTabs === b.navTabs &&
            a.changeMaker === b.changeMaker
          );
        }),
        tap(
          ({
            changeMaker,
            exchangeAdmins,
            serveAdmins,
            epApplications,
            spApplications,
            id,
            navTabs,
            baAdmin,
          }) => {
            const menus: Menu[] = [];
            let selectBusinessProfile: Menu | null = null;
            const authenticated = !!id;
            const adminMode = id === ImConfig.adminEmail;
            const noProfiles = !changeMaker && exchangeAdmins.length === 0 && serveAdmins.length === 0;

            const needOnboarding = exchangeAdmins.find(
              (sa) => sa.exchangePartner.onboardingState !== EpOnboardingState.none
            );
            if (needOnboarding) {
              // Remove profile query param prior to setting the active profile for EP onboard.
              // This is so the active profile is not overridden later down in this effect.
              this.router.navigate([], {
                queryParams: { [IM_ACTIVE_PROFILE_QUERY_PARAM]: null },
                queryParamsHandling: 'merge',
              });
              this.user.session.dispatchers.setActiveProfile(needOnboarding.exchangePartner.id);
            }

            if (noProfiles) {
              /*
            ___           _
           | __|__ ___ __| |___
           | _/ -_) -_) _` (_-<
           |_|\___\___\__,_/__/
          */
              const projectsFeed: MenuItem = {
                title: 'Projects',
                icon: 'star',
                color: 'var(--im-green)',
                uponActivation: () => setImPrimaryColors('none'),
                route: this.route.rawRoutes.path.projects.ROOT,
                click: () => this.route.to.projects.ROOT(),
                inMenu: true,
                inTabs: true,
              };
              const marketplaceFeed: MenuItem = {
                title: 'Marketplace',
                icon: 'bag',
                color: 'var(--im-green)',
                uponActivation: () => setImPrimaryColors('none'),
                route: this.route.rawRoutes.path.market.ROOT,
                click: () => this.route.to.market.ROOT(),
                inMenu: true,
                inTabs: true,
              };

              menus.push({
                title: 'Feeds',
                color: 'var(--im-green)',
                icon: 'list',
                active: !authenticated,
                uponActivation: () => setImPrimaryColors('none'),
                items: [projectsFeed, marketplaceFeed],
              });
            }

            /*
              _      _       _
             /_\  __| |_ __ (_)_ _
            / _ \/ _` | '  \| | ' \
           /_/ \_\__,_|_|_|_|_|_||_|

        */
            if (adminMode) {
              const applications: MenuItem = {
                title: 'Applications',
                icon: 'add',
                color: 'var(--im-green)',
                route: this.route.rawRoutes.path.admin.applications.ROOT,
                click: () => this.route.to.admin.applications.ROOT(),
                inMenu: true,
                inTabs: true,
              };

              const snoop: MenuItem = {
                title: 'Snoop Profile',
                icon: 'glasses',
                color: 'var(--im-green)',
                click: async () => {
                  const user = await this.usersSearch.open({
                    title: 'Snoop User',
                    header: 'Which user do you want to snoop?',
                  });
                  if (user) {
                    this.user.session.dispatchers.snoop(user.id);
                  }
                },
                inMenu: true,
                inTabs: true,
              };

              const assign: MenuItem = {
                title: 'Admin Privileges',
                icon: 'key',
                color: 'var(--im-green)',
                route: this.route.rawRoutes.path.admin.privileges.ROOT,
                click: () => this.route.to.admin.privileges.ROOT(),
                inMenu: true,
                inTabs: true,
              };

              const mint: MenuItem = {
                title: 'Mint CC',
                icon: '/assets/icons/cc-menu.svg',
                color: 'var(--im-green)',
                route: this.route.rawRoutes.path.admin.mint.ROOT,
                click: () => this.route.to.admin.mint.ROOT(),
                inMenu: true,
                inTabs: true,
              };

              const users: MenuItem = {
                title: 'Users',
                icon: 'people',
                color: 'var(--im-green)',
                route: this.route.rawRoutes.path.admin.users.ROOT,
                click: () => this.route.to.admin.users.ROOT(),
                inMenu: true,
                inTabs: true,
              };

              const moderation: MenuItem = {
                title: "Comment Moderation",
                icon: 'chatbox-ellipses',
                color:'var(--im-green)',
                route: this.route.rawRoutes.path.admin.moderation.ROOT,
                click: () => this.route.to.admin.moderation.ROOT(),
                inMenu: true,
                inTabs: true,
              };

              menus.push({
                title: 'Admin',
                color: 'var(--im-green)',
                active: true,
                uponActivation: () => setImPrimaryColors('none'),
                items: [applications, snoop, assign, mint, users, moderation],
              });
            }

            /*
           ___ _                       __  __      _
          / __| |_  __ _ _ _  __ _ ___|  \/  |__ _| |_____ _ _
         | (__| ' \/ _` | ' \/ _` / -_) |\/| / _` | / / -_) '_|
          \___|_||_\__,_|_||_\__, \___|_|  |_\__,_|_\_\___|_|
                             |___/
        */
            if (changeMaker) {
              const activityfeed: MenuItem = {
                title: 'Activity',
                icon: 'pulse',
                route: this.route.rawRoutes.path.activityfeed.ROOT,
                click: () => this.route.to.activityfeed.ROOT({ queryParams: { [AP]: changeMaker.id } }),
                inMenu: true,
                inTabs: true,
              };
              const enrollments: MenuItem = {
                title: 'Serve',
                icon: 'star',
                route: this.route.rawRoutes.path.cm.enrollments.ROOT,
                click: () => this.route.to.cm.enrollments.ROOT({ queryParams: { [AP]: changeMaker.id } }),
                inMenu: true,
                inTabs: true,
              };
              const market: MenuItem = {
                title: 'Spend',
                icon: '/assets/icons/cc-menu.svg',
                route: this.route.rawRoutes.path.market.ROOT,
                click: () => this.route.to.market.ROOT({ queryParams: { [AP]: changeMaker.id } }),
                inMenu: true,
                inTabs: true,
              };
              const wallet: MenuItem = {
                title: 'Wallet',
                icon: 'wallet',
                route: this.route.rawRoutes.path.wallet.ROOT,
                click: () => this.route.to.wallet.ROOT({ queryParams: { [AP]: changeMaker.id } }),
                inMenu: !navTabs,
                inTabs: true,
              };
              const profile: MenuItem = {
                title: 'Profile',
                icon: 'person-circle',
                route: this.route.rawRoutes.path.cm.profile.ROOT,
                click: () => this.route.to.cm.profile.ROOT({ queryParams: { [AP]: changeMaker.id } }),
                inMenu: true,
                inTabs: true,
              };
              // const passport: MenuItem = {
              //   title: 'Passport',
              //   icon: 'globe',
              //   route: this.route.rawRoutes.path.cm.passport.ROOT,
              //   click: () => this.route.to.cm.passport.ROOT({ queryParams: { [AP]: changeMaker.id } }),
              //   inMenu: true,
              //   inTabs: true,
              // };
              // const poi: MenuItem = {
              //   title: 'Proofs of Impact',
              //   icon: 'checkmark-done',
              //   route: this.route.rawRoutes.path.cm.pois.ROOT,
              //   click: () => this.route.to.cm.pois.ROOT({ queryParams: { [AP]: changeMaker.id } }),
              //   inMenu: true,
              //   inTabs: false,
              // };
              const chat: MenuItem = {
                title: 'Messages',
                icon: 'mail',
                route: this.route.rawRoutes.path.chat.ROOT,
                click: () => this.route.to.chat.ROOT({ queryParams: { [AP]: changeMaker.id } }),
                inMenu: true,
                inTabs: false,
              };
              const settings: MenuItem = {
                title: 'Settings',
                icon: 'settings',
                route: this.route.rawRoutes.path.cm.settings.ROOT,
                click: () => this.route.to.cm.settings.ROOT({ queryParams: { [AP]: changeMaker.id } }),
                inMenu: true,
                inTabs: false,
              };

              menus.push({
                title: `@${changeMaker.handle.id}`,
                subtitle: 'ChangeMaker',
                active: false,
                color: 'var(--im-green)',
                profile: changeMaker,
                uponActivation: () => setImPrimaryColors('cm'),
                items: [activityfeed, enrollments, wallet, market, profile, chat, settings],
              });
            }

            /*
            ___        _                         _      _       _
           | __|_ ____| |_  __ _ _ _  __ _ ___  /_\  __| |_ __ (_)_ _  ___
           | _|\ \ / _| ' \/ _` | ' \/ _` / -_)/ _ \/ _` | '  \| | ' \(_-<
           |___/_\_\__|_||_\__,_|_||_\__, \___/_/ \_\__,_|_|_|_|_|_||_/__/
                                     |___/
        */
            for (const ea of exchangeAdmins) {
              const dashboard: MenuItem = {
                title: 'Dashboard',
                icon: 'grid',
                route: this.route.rawRoutes.path.ep.dashboard.ROOT,
                click: () =>
                  this.route.to.ep.dashboard.ROOT({ queryParams: { [AP]: ea.exchangePartner.id } }),
                inMenu: true,
                inTabs: true,
              };
              const storefront: MenuItem = {
                title: 'Storefront',
                icon: 'storefront',
                route: this.route.rawRoutes.path.ep.storefront.ROOT,
                click: () =>
                  this.route.to.ep.storefront.ROOT({
                    queryParams: { [AP]: ea.exchangePartner.id },
                  }),
                inMenu: true,
                inTabs: true,
              };
              const wallet: MenuItem = {
                title: 'Wallet',
                icon: 'wallet',
                route: this.route.rawRoutes.path.wallet.ROOT,
                click: () => this.route.to.wallet.ROOT({ queryParams: { [AP]: ea.exchangePartner.id } }),
                inMenu: !navTabs,
                inTabs: true,
              };
              const market: MenuItem = {
                title: 'Spend',
                icon: '/assets/icons/cc-menu.svg',
                route: this.route.rawRoutes.path.market.ROOT,
                click: () => this.route.to.market.ROOT({ queryParams: { [AP]: ea.exchangePartner.id } }),
                inMenu: true,
                inTabs: true,
              };
              const vouchers: MenuItem = {
                title: 'Vouchers',
                icon: 'pricetag',
                route: this.route.rawRoutes.path.ep.vouchers.ROOT,
                click: () => this.route.to.ep.vouchers.ROOT({ queryParams: { [AP]: ea.exchangePartner.id } }),
                inMenu: true,
                inTabs: false,
              };
              const budget: MenuItem = {
                title: 'Budget',
                icon: 'cash',
                route: this.route.rawRoutes.path.ep.budget.ROOT,
                click: () => this.route.to.ep.budget.ROOT({ queryParams: { [AP]: ea.exchangePartner.id } }),
                inMenu: true,
                inTabs: true,
              };
              const admins: MenuItem = {
                title: 'Admins',
                icon: 'people',
                route: this.route.rawRoutes.path.ep.admins.ROOT,
                click: () => this.route.to.ep.admins.ROOT({ queryParams: { [AP]: ea.exchangePartner.id } }),
                inMenu: true,
                inTabs: false,
              };
              const chat: MenuItem = {
                title: 'Messages',
                icon: 'mail',
                route: this.route.rawRoutes.path.chat.ROOT,
                click: () => this.route.to.chat.ROOT({ queryParams: { [AP]: ea.exchangePartner.id } }),
                inMenu: true,
                inTabs: false,
              };
              const settings: MenuItem = {
                title: 'Settings',
                icon: 'settings',
                route: this.route.rawRoutes.path.ep.settings.ROOT,
                click: () => this.route.to.ep.settings.ROOT({ queryParams: { [AP]: ea.exchangePartner.id } }),
                inMenu: true,
                inTabs: false,
              };

              menus.push({
                title: `@${ea.exchangePartner.handle.id}`,
                subtitle: 'ExchangePartner',
                active: false,
                color: 'var(--im-orange)',
                uponActivation: () => setImPrimaryColors('ep'),
                profile: ea.exchangePartner,
                items: [dashboard, storefront, wallet, market, budget, vouchers, admins, chat, settings],
              });
            }

            /*
            ___                    _      _       _
           / __| ___ _ ___ _____  /_\  __| |_ __ (_)_ _  ___
           \__ \/ -_) '_\ V / -_)/ _ \/ _` | '  \| | ' \(_-<
           |___/\___|_|  \_/\___/_/ \_\__,_|_|_|_|_|_||_/__/

        */
            for (const sa of serveAdmins) {
              // const profile: MenuItem = {
              //   title: 'Profile',
              //   icon: 'person-circle',
              //   route: 'sp-profile',
              //   inMenu: true,
              //   inTabs: true,
              // };
              const projects: MenuItem = {
                title: 'Projects',
                icon: 'star',
                route: this.route.rawRoutes.path.sp.myProjects.ROOT,
                click: () => this.route.to.sp.myProjects.ROOT({ queryParams: { [AP]: sa.servePartner.id } }),
                inMenu: true,
                inTabs: true,
              };
              const wallet: MenuItem = {
                title: 'Wallet',
                icon: 'wallet',
                route: this.route.rawRoutes.path.wallet.ROOT,
                click: () => this.route.to.wallet.ROOT({ queryParams: { [AP]: sa.servePartner.id } }),
                inMenu: !navTabs,
                inTabs: true,
              };
              const market: MenuItem = {
                title: 'Spend',
                icon: '/assets/icons/cc-menu.svg',
                route: this.route.rawRoutes.path.market.ROOT,
                click: () => this.route.to.market.ROOT({ queryParams: { [AP]: sa.servePartner.id } }),
                inMenu: true,
                inTabs: true,
              };
              const admins: MenuItem = {
                title: 'Admins',
                icon: 'people',
                route: this.route.rawRoutes.path.sp.admins.ROOT,
                click: () => this.route.to.sp.admins.ROOT({ queryParams: { [AP]: sa.servePartner.id } }),
                inMenu: true,
                inTabs: true,
              };
              const chat: MenuItem = {
                title: 'Messages',
                icon: 'mail',
                route: this.route.rawRoutes.path.chat.ROOT,
                click: () => this.route.to.chat.ROOT({ queryParams: { [AP]: sa.servePartner.id } }),
                inMenu: true,
                inTabs: true,
              };
              const settings: MenuItem = {
                title: 'Settings',
                icon: 'settings',
                route: this.route.rawRoutes.path.sp.settings.ROOT,
                click: () => this.route.to.sp.settings.ROOT({ queryParams: { [AP]: sa.servePartner.id } }),
                inMenu: true,
                inTabs: false,
              };

              menus.push({
                title: `@${sa.servePartner.handle.id}`,
                subtitle: 'ServePartner',
                active: false,
                color: `var(--im-purple)`,
                uponActivation: () => setImPrimaryColors('sp'),
                profile: sa.servePartner,
                items: [projects, chat, wallet, market, admins, settings],
              });
            }

            /*
            ___        _             _ _         _   _
           | __|_ __  /_\  _ __ _ __| (_)__ __ _| |_(_)___ _ _  ___
           | _|| '_ \/ _ \| '_ \ '_ \ | / _/ _` |  _| / _ \ ' \(_-<
           |___| .__/_/ \_\ .__/ .__/_|_\__\__,_|\__|_\___/_||_/__/
               |_|        |_|  |_|
        */
            for (const epApp of epApplications) {
              const withdraw: MenuItem = {
                title: 'Withdraw Application',
                icon: 'remove-circle',
                route: 'Withdraw Ep Application',
                click: () => this.user.session.dispatchers.withdrawEpApplication(epApp),
                inMenu: true,
                inTabs: true,
              };

              menus.push({
                title: `@${epApp.handle.id}`,
                subtitle: 'Pending ExchangePartner',
                active: false,
                color: 'var(--im-orange)',
                uponActivation: () => setImPrimaryColors('ep'),
                items: [withdraw],
              });
            }

            /*
            ___        _             _ _         _   _
           / __|_ __  /_\  _ __ _ __| (_)__ __ _| |_(_)___ _ _  ___
           \__ \ '_ \/ _ \| '_ \ '_ \ | / _/ _` |  _| / _ \ ' \(_-<
           |___/ .__/_/ \_\ .__/ .__/_|_\__\__,_|\__|_\___/_||_/__/
               |_|        |_|  |_|
        */
            for (const spApp of spApplications) {
              const withdraw: MenuItem = {
                title: 'Withdraw Application',
                icon: 'remove-circle',
                route: 'Withdraw Sp Application',
                click: () => this.user.session.dispatchers.withdrawSpApplication(spApp),
                inMenu: true,
                inTabs: true,
              };

              menus.push({
                title: `@${spApp.handle.id}`,
                subtitle: 'Pending ServePartner',
                active: false,
                color: 'var(--im-purple)',
                uponActivation: () => setImPrimaryColors('sp'),
                items: [withdraw],
              });
            }

            if (authenticated && !adminMode) {
              /*
                _             _ _         _   _
               /_\  _ __ _ __| (_)__ __ _| |_(_)___ _ _  ___
              / _ \| '_ \ '_ \ | / _/ _` |  _| / _ \ ' \(_-<
             /_/ \_\ .__/ .__/_|_\__\__,_|\__|_\___/_||_/__/
                   |_|  |_|
          */
              const createCmProfile: MenuItem[] = changeMaker
                ? []
                : [
                    {
                      title: 'Create ChangeMaker Profile',
                      icon: 'person-add',
                      color: 'var(--im-green)',
                      route: this.route.rawRoutes.path.applications.cm.ROOT,
                      uponActivation: () => setImPrimaryColors('cm'),
                      click: () => this.route.to.applications.cm.ROOT(),
                      inMenu: true,
                      inTabs: true,
                    },
                  ];

              const registerEp: MenuItem = {
                title: 'Register an ExchangePartner',
                icon: 'person-add',
                color: 'var(--im-orange)',
                uponActivation: () => setImPrimaryColors('ep'),
                route: this.route.rawRoutes.path.applications.ep.ROOT,
                click: () => this.route.to.applications.ep.ROOT(),
                inMenu: true,
                inTabs: true,
              };

              const registerSp: MenuItem = {
                title: 'Register a ServePartner',
                icon: 'person-add',
                color: 'var(--im-purple)',
                uponActivation: () => setImPrimaryColors('sp'),
                route: this.route.rawRoutes.path.applications.sp.ROOT,
                click: () => this.route.to.applications.sp.ROOT(),
                inMenu: true,
                inTabs: true,
              };

              menus.push({
                title: 'Add a new Account',
                icon: 'add',
                color: 'var(--im-menu-item-icon)',
                active: noProfiles,
                uponActivation: () => setImPrimaryColors('none'),
                items: [...createCmProfile, registerEp, registerSp],
              });
            }

            if (authenticated && !adminMode && baAdmin) {
              selectBusinessProfile = {
                color: '',
                active: false,
                title: 'Select Business Profile',
                icon: 'key',
                items: [
                  {
                    title: 'Select Business Profile',
                    icon: 'key',
                    route: this.route.rawRoutes.path.ba.download.ROOT,
                    uponActivation: () => setImPrimaryColors('none'),
                    click: () => this.route.to.ba.download.ROOT(),
                    color: 'var(--im-orange)',
                    inMenu: false,
                    inTabs: false,
                  },
                ],
              };
            }

            this.updateState({
              authenticated,
              email: id,
              navTabs,
              menus,
              selectBusinessProfile,
              changeMaker,
            });
          }
        ),
        switchMap(() =>
          combineLatest([
            this.router.events.pipe(startWith(new NavigationEnd(0, this.router.url, this.router.url))).pipe(
              tap((event) => {
                if (event instanceof NavigationStart) {
                  const profileId = getQueryStringValue(IM_ACTIVE_PROFILE_QUERY_PARAM, event.url);
                  if (profileId) {
                    this.user.session.dispatchers.setActiveProfile(profileId);
                  }
                }
              })
            ),
            this.user.session.selectors.activeProfile$.pipe(
              tapOnce((p) => {
                const profile = this.state.menus.find((m) => m.profile?.id === p.id);
                if (profile) {
                  profile.active = true;
                }
              })
            ),
          ])
        ),
        tap(([event, activeProfile]) => {
          if (event instanceof NavigationStart) {
            for (const menu of [...this.state.menus, this.state.settings]) {
              const activeChild = this.getActiveMenuChild(menu, event.url, activeProfile);
              if (activeChild) {
                activeChild.loading = true;
                activeChild.isActiveRoute = false;
                this.user.session.dispatchers.setLoadingRoute(event.url);
                this.closeWallet();
                break; // No need to continue once we found the active menu item.
              }
            }
            this.updateState({ selectedRoute: event.url });
          } else if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
            const url = event instanceof NavigationEnd ? event.urlAfterRedirects : this.router.url;
            for (const menu of [...this.state.menus, this.state.settings]) {
              menu.items.forEach((c) => (c.isActiveRoute = c.loading = false));
              const activeChild = this.getActiveMenuChild(menu, url, activeProfile);
              if (activeChild) {
                activeChild.loading = false;
                activeChild.isActiveRoute = true;
                menu.uponActivation?.();
                activeChild.uponActivation?.();
                // Notice no break here since we want to reset all children's isActiveRoute to false.
              }
            }
            this.updateState({ selectedRoute: url });
          }
          this.updateState({ activeProfile });
        })
      )
    );
  }

  private showPopUpOnVoucherBuy() {
    this.effect(() =>
      this.user.vouchers.actionListeners.buyVoucher.success.pipe(
        switchMap(({ voucher }) => {
          const ref = this.popover.open<ImPopoverComponent, ImPopoverInput, ImPopoverOutput>({
            origin: this.walletFab || 'bottom',
            component: ImPopoverComponent,
            data: {
              content: `
                <div style="display: grid">
                  <span style="font-size: 1p6x">
                    Purchase
                    <b style="font-family: 'Roboto Mono', monospace">${voucher.code}</b>
                    is stored under <b>Vouchers</b>.
                  </span>
                  <span>Please present upon checkout.</span>
                </div>
              `,
              // Already divided by 100 in component.
              amount: voucher.amount,
            },
          });
          return ref.afterClosed$;
        }),
        tap((data) => {
          if (data === 'action') {
            this.user.session.dispatchers.toggleWallet(true);
            // `setTimeout` to allow wallet to open, then set wallet tab.
            setTimeout(() => this.user.session.dispatchers.setWalletTab(WalletTabs.vouchers));
          }
        })
      )
    );

    // Testing purposes
    // setTimeout(() => {
    //   const ref = this.popover.open<ImPopoverComponent, ImPopoverInput, ImPopoverOutput>({
    //     origin: this.walletFab || 'bottom',
    //     component: ImPopoverComponent,
    //     data: {
    //       content: `
    //         <div style="display: grid">
    //           <span style="font-size: 16px">
    //             Purchase
    //             <b style="font-family: 'Roboto Mono', monospace">33f0dw</b>
    //             is stored under <b>Vouchers</b>.
    //           </span>
    //           <span>Please present upon checkout.</span>
    //         </div>
    //       `,
    //       amount: 23432,
    //     },
    //   });
    //   ref.afterClosed$.pipe(take(1)).subscribe((data) => {
    //     if (data === 'action') {
    //       this.user.session.dispatchers.toggleWallet(true, WalletTabs.vouchers);
    //     }
    //   });
    // }, 1000);
  }

  private showPopUpOnTransaction() {
    this.effect(() =>
      this.user.transactions.actionListeners.transaction.success.pipe(
        switchMap(({ transaction }) => {
          const ref = this.popover.open<ImPopoverComponent, ImPopoverInput, ImPopoverOutput>({
            origin: this.walletFab || 'bottom',
            component: ImPopoverComponent,
            data: {
              content: `
                <div style="font-size: 16px">
                  A record of payment is
                  <br />
                  in wallet under <b>History</b>.
                </div>
              `,
              // Already divided by 100 in component.
              amount: transaction.amount,
            },
          });
          return ref.afterClosed$;
        }),
        tap((data) => {
          if (data === 'action') {
            this.user.session.dispatchers.toggleWallet(true);
            // `setTimeout` to allow wallet to open, then set wallet tab.
            setTimeout(() => this.user.session.dispatchers.setWalletTab(WalletTabs.history));
          }
        })
      )
    );
  }

  private listenOnboardingActions() {
    this.effect(() =>
      this.user.session.selectors.state$.pipe(
        filter(({ id }) => !!id && id !== ImConfig.adminEmail),
        take(1),
        withLatestFrom(this.activatedRoute.queryParams),
        tap(([{ changeMaker, exchangeAdmins, serveAdmins, epApplications, spApplications }, query]) => {
          const noProfiles =
            !changeMaker &&
            exchangeAdmins.length === 0 &&
            serveAdmins.length === 0 &&
            epApplications.length === 0 &&
            spApplications.length === 0;
          if (noProfiles) {
            const register = {
              cm: () => this.route.to.applications.cm.ROOT(),
              sp: () => this.route.to.applications.sp.ROOT(),
              ep: () => this.route.to.applications.ep.ROOT(),
              market: () => this.route.to.applications.cm.ROOT(),
            };
            const fn = register[query['register'] as keyof typeof register];
            if (fn) {
              fn();
            } else {
              this.welcome.open();
            }
          }
        }),
        switchMap(() =>
          this.user.session.selectors.state$.pipe(
            distinctUntilChanged((a, b) => a.changeMaker?.onboardingState === b.changeMaker?.onboardingState)
          )
        ),
        switchMap((state) => {
          switch (state?.changeMaker?.onboardingState) {
            case 'market':
              this.updateState({ onboarding: 'cm' });
              this.route.to.market.ROOT();
              this.infoModal.open({
                title: "Here's our Marketplace",
                description: `The items are available for purchase using our TimeCredit. To earn TimeCredits, either make an offer to earn credits, or sign up to become a ChangeMaker`,
                icon: { name: '/assets/onboard/onboard-projects.svg', source: 'src' },
                useBackground: false,
                buttonText: 'Next',
              });
              this.user.cmProfile.dispatchers.editCmProfile({ onboardingState: 'done' });
              break;
            case 'project':
              this.updateState({ onboarding: 'cm' });
              this.route.to.projects.ROOT();
              this.infoModal.open({
                title: 'Choose a Project',
                description: `The following Projects are available. Select a Project to learn more about it and begin the application process.`,
                icon: { name: '/assets/onboard/onboard-projects.svg', source: 'src' },
                useBackground: false,
                buttonText: 'Next',
              });
              break;

            default:
              this.updateState({ onboarding: null });
              return this.user.session.selectors.activeProfileEp$;
          }
          return EMPTY;
        }),
        tap((ep) => {
          switch (ep?.onboardingState) {
            case EpOnboardingState.profile:
              this.updateState({ onboarding: 'ep' });
              this.route.to.ep.onboarding.ROOT();
              break;

            default:
              this.updateState({ onboarding: null });
              break;
          }
        })
      )
    );
  }

  async skip() {
    const modal = await this.infoModal.open({
      title: 'No Project Selected',
      description: `Didn’t see a Project that interests you?
        No worries, Projects are posted to the feed frequently.
        You can search for current and newly posted Projects by navigating to the Projects Tab at a later time.`,
      icon: { name: '/assets/icons/notify!.svg', source: 'src' },
      useBackground: false,
      buttonText: 'Skip',
      backText: 'and see all current Offers/Requests...',
    });
    const { data } = await modal.onDidDismiss();
    if (data) {
      this.infoModal.open({
        title: 'ChangeMaker onboarding complete!',
        description: `You're all set.`,
        icon: { name: 'checkmark', source: 'ionicon' },
        useBackground: true,
        buttonText: 'OK',
      });
      this.user.cmProfile.dispatchers.editCmProfile({ onboardingState: 'none' });
    }
  }

  private getActiveMenuChild(category: Menu, url: string, activeProfile: ActiveProfile) {
    return category.items.find((item) => {
      const noUuid = url
        .split('?')[0]
        .replace(/\/\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/g, '');
      let isActive = noUuid === item.route;
      if (
        (noUuid.includes('market') && item.title === 'Spend') ||
        (noUuid.includes('projects') && item.title === 'Serve') ||
        (noUuid.includes('cm/enrollments') && item.title === 'Serve')
      ) {
        isActive = true;
      }
      if (category.profile) {
        isActive &&= category.profile.handle.id === activeProfile.handle.id;
      }
      return isActive;
    });
  }

  menuHeaderClicked(menu: Menu) {
    this.toggleProfilesMenu();
    !menu.active && menu.items[0].click?.();
    this.state.menus.forEach((m) => (m.active = false));
    menu.active = true;
    if (menu.profile) {
      this.user.session.dispatchers.setActiveProfile(menu.profile.id);
      this.menu.close();
    }
  }

  toggleProfilesMenu() {
    this.updateState({ profilesMenuOpen: !this.state.profilesMenuOpen });
  }

  itemClick(item: MenuItem) {
    item.click?.();
    this.menu.close();
  }

  login() {
    this.route.to.login.ROOT();
  }

  signUp() {
    this.route.to.signUp.ROOT();
  }

  settings() {
    this.route.to.settings.ROOT();
  }

  newPoi() {
    this.cmApi.newPoi();
  }

  getProfilePic(profile: ActiveProfile) {
    if (profile.type === 'cm') {
      return profile.profilePicFilePath;
    }
    if (profile.type === 'ep' || profile.type === 'sp') {
      return profile.logoFilePath;
    }
    return;
  }

  getMenuColor(menu: Menu) {
    const active = menu.items.find((m) => m.isActiveRoute);
    if (active) {
      return active.color || menu.color;
    }
    return menu.color;
  }

  inTabs(items: MenuItem[]) {
    return items.filter((i) => i.inTabs);
  }

  inMenu(items: MenuItem[]) {
    return items.filter((i) => i.inMenu);
  }

  closeWallet() {
    if (this.state.walletShown) {
      this.toggleWallet();
    }
    return true;
  }

  activeMenu() {
    return this.state.menus.find((m) => m.active);
  }

  toggleWallet() {
    this.updateState({ walletShown: !this.state.walletShown });
    // Wait for DOM to create im-wallet before querying it.
    animationFrameScheduler.schedule(async () => {
      const tabs = document.querySelector('ion-tab-bar') ?? [];
      const wallet = document.getElementsByClassName('im-wallet') ?? [];
      const fab = document.querySelector('ion-fab') ?? [];
      const popover = document.querySelector('im-popover') ?? [];

      if (this.state.walletShown) {
        this.backDrop = this.render.createElement('div');
        this.render.setStyle(this.backDrop, 'height', '100vh');
        this.render.setStyle(this.backDrop, 'width', '100vw');
        this.render.setStyle(this.backDrop, 'position', 'absolute');
        this.render.setStyle(this.backDrop, 'top', '0');
        this.render.setStyle(this.backDrop, 'zIndex', '10');
        this.render.setStyle(this.backDrop, 'background', 'black');

        const tabsInner = document.querySelector('.tabs-inner');
        if (tabsInner) {
          tabsInner.before(this.backDrop);
        }
      }

      const backdropAnimation = this.animationCtrl
        .create()
        .addElement(this.backDrop)
        .fromTo('opacity', '0.01', '0.4');

      const tabAnimation = this.animationCtrl
        .create()
        .addElement(tabs)
        .fromTo('transform', 'translateY(0)', `translateY(-${this.height})`);

      const fabAnimation = this.animationCtrl
        .create()
        .addElement(fab)
        .fromTo('transform', 'translateY(0)', `translateY(-${this.height})`);

      const popoverAnimation = this.animationCtrl
        .create()
        .addElement(popover)
        .fromTo('transform', 'translateY(0)', `translateY(-${this.height})`);

      const walletAnimation = this.animationCtrl
        .create()
        .addElement(wallet[0])
        .beforeStyles({ opacity: 1 })
        .fromTo('transform', 'translateY(100%)', `translateY(0)`);

      if (this.state.walletShown) {
        await this.animationCtrl
          .create()
          .easing('ease-in-out')
          .duration(250)
          .beforeAddClass('show-modal')
          .addAnimation([backdropAnimation, fabAnimation, popoverAnimation, walletAnimation, tabAnimation])
          .play();
      } else {
        await this.animationCtrl
          .create()
          .easing('ease-in-out')
          .duration(250)
          .beforeAddClass('show-modal')
          .addAnimation([backdropAnimation, fabAnimation, popoverAnimation, walletAnimation, tabAnimation])
          .direction('reverse')
          .play();
        this.backDrop.remove();
      }
    });
  }

  isActivityFeedRoute(): boolean {
    return this.router.url.startsWith('/activityfeed');
  }
}
