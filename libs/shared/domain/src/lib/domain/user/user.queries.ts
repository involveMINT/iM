import { createQuery } from '@orcha/common';
import { User } from './user.model';

export const LoginQuery = createQuery<{ token: string }>()({ token: true });
export const SignUpQuery = LoginQuery;
export const AdminLoginQuery = LoginQuery;
export const ValidateAdminTokenQuery = LoginQuery;

export const UserQuery = createQuery<User>()({
  id: true,
  joyride: true,
  baAdmin: true,
  dateLastLoggedIn: true,
  changeMaker: {
    id: true,
    profilePicFilePath: true,
    bio: true,
    firstName: true,
    lastName: true,
    onboardingState: true,
    phone: true,
    handle: {
      id: true,
    },
    address: {
      id: true,
      address1: true,
      address2: true,
      address3: true,
      city: true,
      state: true,
      zip: true,
      country: true,
    },
    view: {
      earnedCredits: true,
      poiApproved: true,
      secondsCompleted: true,
      spentCredits: true,
    },
  },
  exchangeAdmins: {
    id: true,
    exchangePartner: {
      id: true,
      handle: {
        id: true,
      },
      onboardingState: true,
      name: true,
      description: true,
      logoFilePath: true,
      website: true,
      address: {
        id: true,
        address1: true,
        city: true,
        state: true,
        zip: true,
        country: true,
      },
      phone: true,
      email: true,
      ein: true,
      imagesFilePaths: true,
      budget: true,
      budgetEndDate: true,
      listStoreFront: true,
      view: {
        receivedThisMonth: true,
      },
    },
  },
  serveAdmins: {
    id: true,
    servePartner: {
      id: true,
      name: true,
      description: true,
      logoFilePath: true,
      website: true,
      address: {
        id: true,
        address1: true,
        city: true,
        state: true,
        zip: true,
        country: true,
      },
      phone: true,
      email: true,
      imagesFilePaths: true,
      handle: {
        id: true,
      },
    },
  },
  epApplications: {
    id: true,
    name: true,
    handle: {
      id: true,
    },
  },
  spApplications: {
    id: true,
    name: true,
    handle: {
      id: true,
    },
  },
});

/** Using this instead of UserQuery because causes fail when trying to pull 'view' field 
 * on .query() from the ActivityPostRepo.
 */
export const ActivityPostUserQuery = createQuery<User & { token: string }>()({
  id: true,
  dateLastLoggedIn: true,
  changeMaker: {
    id: true,
    profilePicFilePath: true,
    bio: true,
    firstName: true,
    lastName: true,
    onboardingState: true,
    phone: true,
    handle: {
      id: true,
    },
    address: {
      id: true,
      address1: true,
      address2: true,
      address3: true,
      city: true,
      state: true,
      zip: true,
      country: true,
    },
  },
});

export const SnoopQuery = createQuery<User & { token: string }>()({
  ...UserQuery,
  token: true,
});

export const UserPrivilegeQuery = createQuery<User[]>()({
  id: true,
  baAdmin: true,
});

// TODO should go in handle domain
export const VerifyHandleQuery = createQuery<{ isUnique: boolean }>()({
  isUnique: true,
});

export const UserSearchQuery = createQuery<User>()({
  id: true,
  changeMaker: {
    handle: {
      id: true,
    },
    firstName: true,
    lastName: true,
  },
});

export const VerifyUserEmailQuery = createQuery<{ isUnique: boolean }>()({
  isUnique: true,
});

export const AdminUserSearchQuery = createQuery<User[]>()({
  id: true,
  dateCreated: true,
  active: true,
  baAdmin: true,
  dateLastLoggedIn: true,
  changeMaker: {
    firstName: true,
    lastName: true,
    handle: { id: true },
    bio: true,
    dateCreated: true,
    phone: true,
    onboardingState: true,
  },
  exchangeAdmins: {
    datePermitted: true,
    exchangePartner: {
      name: true,
      email: true,
      phone: true,
      ein: true,
      dateCreated: true,
      handle: { id: true },
      description: true,
      website: true,
      address: {
        address1: true,
        address2: true,
        address3: true,
        city: true,
        country: true,
        state: true,
        zip: true,
      },
    },
  },
  serveAdmins: {
    datePermitted: true,
    servePartner: {
      name: true,
      email: true,
      phone: true,
      dateCreated: true,
      handle: { id: true },
      description: true,
      website: true,
      address: {
        address1: true,
        address2: true,
        address3: true,
        city: true,
        country: true,
        state: true,
        zip: true,
      },
    },
  },
  epApplications: {
    handle: { id: true },
    phone: true,
    name: true,
    dateCreated: true,
    ein: true,
    email: true,
    website: true,
    address: {
      address1: true,
      address2: true,
      address3: true,
      city: true,
      country: true,
      state: true,
      zip: true,
    },
  },
  spApplications: {
    handle: { id: true },
    phone: true,
    name: true,
    dateCreated: true,
    email: true,
    website: true,
    address: {
      address1: true,
      address2: true,
      address3: true,
      city: true,
      country: true,
      state: true,
      zip: true,
    },
  },
});
