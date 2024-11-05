export const FRONTEND_ROUTES_TOKEN = 'FRONTEND_ROUTES';

import { IRoutes } from '@involvemint/shared/util';

export type FrontendRoutes = IRoutes<IFrontendRoutes>;

export type IFrontendRoutes = typeof ImRoutes;

/**
 * ! Make sure the ROOT value matches its object's key.
 */
export const ImRoutes = {
  ROOT: '',
  login: {
    ROOT: 'login',
  },
  comments: {
    ROOT: 'comments',
    THREAD: 0,
  },
  signUp: {
    ROOT: 'signUp',
  },
  activateUserAccount: {
    ROOT: 'activateUserAccount',
  },
  verifyEmail: {
    ROOT: 'verifyEmail',
  },
  forgotPassword: {
    ROOT: 'forgotPassword',
  },
  forgotPasswordChange: {
    ROOT: 'forgotPasswordChange',
  },
  market: {
    ROOT: 'market',
    ep: {
      ROOT: 'ep',
      COVER: 0,
    },
    myOffers: {
      ROOT: 'myOffers',
      EDIT: 0,
    },
    offer: {
      ROOT: 'offer',
      OFFER: 0,
    },
    myRequests: {
      ROOT: 'myRequests',
      EDIT: 0,
    },
    request: {
      ROOT: 'request',
      REQUEST: 0,
    },
  },
  activityfeed: {
    ROOT: 'activityfeed',
  },
  settings: {
    ROOT: 'settings',
  },
  wallet: {
    ROOT: 'wallet',
  },
  chat: {
    ROOT: 'chat',
    ROOM: 0,
  },
  projects: {
    ROOT: 'projects',
    COVER: 0,
  },
  applications: {
    ROOT: 'applications',
    cm: {
      ROOT: 'cm',
    },
    ep: {
      ROOT: 'ep',
    },
    sp: {
      ROOT: 'sp',
    },
  },
  cm: {
    ROOT: 'cm',
    profile: {
      ROOT: 'profile',
    },
    enrollments: {
      ROOT: 'enrollments',
      ENROLLMENT: 0,
    },
    passport: {
      ROOT: 'passport',
      DOCUMENT: 0,
    },
    pois: {
      ROOT: 'pois',
      POI: 0,
    },
    settings: {
      ROOT: 'settings',
    },
  },
  sp: {
    ROOT: 'sp',
    myProjects: {
      ROOT: 'myProjects',
      EDIT: 0,
    },
    admins: {
      ROOT: 'admins',
    },
    settings: {
      ROOT: 'settings',
    },
  },
  ep: {
    ROOT: 'ep',
    onboarding: {
      ROOT: 'onboarding',
    },
    dashboard: {
      ROOT: 'dashboard',
    },
    storefront: {
      ROOT: 'storefront',
      myOffers: {
        ROOT: 'myOffers',
        EDIT: 0,
      },
      myRequests: {
        ROOT: 'myRequests',
        EDIT: 0,
      },
    },
    admins: {
      ROOT: 'admins',
    },
    budget: {
      ROOT: 'budget',
    },
    vouchers: {
      ROOT: 'vouchers',
      VOUCHER: 0,
    },
    settings: {
      ROOT: 'settings',
    },
  },
  ba: {
    ROOT: 'ba',
    download: {
      ROOT: 'download',
    },
  },
  admin: {
    ROOT: 'admin',
    applications: {
      ROOT: 'applications',
    },
    privileges: {
      ROOT: 'privileges',
    },
    mint: {
      ROOT: 'mint',
    },
    users: {
      ROOT: 'users',
    },
    moderation: {
      ROOT: 'moderation',
    }
  },
};
