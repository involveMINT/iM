import { ImConfig, User, UserQuery } from '@involvemint/shared/domain';
import { UnArray } from '@involvemint/shared/util';
import { createReducer, on } from '@ngrx/store';
import { IParser } from '@orcha/common';
import * as CmProfileActions from './cm/cm-profile.actions';
import * as EpProfileActions from './ep/ep-profile.actions';
import * as SpProfileActions from './sp/sp-profile.actions';
import * as UserSessionActions from './user-session.actions';

export const USER_SESSION_KEY = 'userSession';

export type UserStoreModel = IParser<User, typeof UserQuery>;

export type CmActiveProfile = UserStoreModel['changeMaker'];
export type EpActiveProfile = UnArray<UserStoreModel['exchangeAdmins']>['exchangePartner'];
export type SpActiveProfile = UnArray<UserStoreModel['serveAdmins']>['servePartner'];

export type ActiveProfile =
  | (CmActiveProfile & { type: 'cm' })
  | (EpActiveProfile & { type: 'ep' })
  | (SpActiveProfile & { type: 'sp' })
  | { type: 'none'; id: string; handle: { id: string } };

export type ProfileType = ActiveProfile['type'];

export interface ExchangeAdminsWithBaDownloaded extends UnArray<UserStoreModel['exchangeAdmins']> {
  baDownloaded: boolean;
}

export interface UserSessionState extends UserStoreModel {
  activeProfileId: string | null;
  navTabs: boolean;
  sideMenuBehavior: 'responsive' | 'hidden';
  loadingRoute: string;
}

const navTabs = localStorage.getItem('navTabs');
const sideMenuBehavior = localStorage.getItem('sideMenuBehavior');

const initialState: UserSessionState = {
  id: '',
  activeProfileId: null,
  navTabs: !navTabs,
  sideMenuBehavior: (sideMenuBehavior as UserSessionState['sideMenuBehavior']) ?? 'hidden',
  epApplications: [],
  spApplications: [],
  exchangeAdmins: [],
  serveAdmins: [],
  changeMaker: undefined,
  loadingRoute: '',
  joyride: false,
  baAdmin: false,
  dateLastLoggedIn: "",
};

export const UserSessionReducer = createReducer(
  initialState,
  on(UserSessionActions.loadingRoute, (state, { route }): UserSessionState => {
    return {
      ...state,
      loadingRoute: route,
    };
  }),
  on(UserSessionActions.adminLoginSuccess, (state): UserSessionState => {
    return {
      ...state,
      id: ImConfig.adminEmail,
    };
  }),
  on(UserSessionActions.userLogin, (state): UserSessionState => {
    return {
      ...state,
    };
  }),
  on(UserSessionActions.userSignUp, (state): UserSessionState => {
    return {
      ...state,
    };
  }),
  on(UserSessionActions.getUserDataSuccess, (state, data): UserSessionState => {
    return {
      ...state,
      ...data,
    };
  }),
  on(
    UserSessionActions.baDownloadEpAdminSuccess,
    (state, { downloadedEpAdmin }): UserSessionState => ({
      ...state,
      exchangeAdmins: [...state.exchangeAdmins, downloadedEpAdmin],
    })
  ),
  on(
    UserSessionActions.baRemoveDownloadedEpAdminSuccess,
    (state, { id }): UserSessionState => ({
      ...state,
      exchangeAdmins: state.exchangeAdmins.filter((exchangeAdmin) => exchangeAdmin.id !== id),
    })
  ),
  on(
    UserSessionActions.baSubmitEpApplicationSuccess,
    (state, { downloadedEpAdmin }): UserSessionState => ({
      ...state,
      exchangeAdmins: downloadedEpAdmin
        ? [...state.exchangeAdmins, downloadedEpAdmin]
        : [...state.exchangeAdmins],
    })
  ),
  on(UserSessionActions.snoopSuccess, (state, data): UserSessionState => {
    return {
      ...state,
      ...data,
    };
  }),
  on(UserSessionActions.setActiveProfile, (state, { profileId }): UserSessionState => {
    return { ...state, activeProfileId: profileId };
  }),
  on(UserSessionActions.createChangeMakerProfileSuccess, (state, { cmProfile }): UserSessionState => {
    return {
      ...state,
      changeMaker: cmProfile,
      activeProfileId: cmProfile.id,
    };
  }),
  on(UserSessionActions.submitEpApplicationSuccess, (state, { epApp }): UserSessionState => {
    return {
      ...state,
      epApplications: [...state.epApplications, epApp],
    };
  }),
  on(UserSessionActions.withdrawEpApplicationSuccess, (state, { deletedId }): UserSessionState => {
    return {
      ...state,
      epApplications: state.epApplications.filter((s) => s.id !== deletedId),
    };
  }),
  on(UserSessionActions.submitSpApplicationSuccess, (state, { spApp }): UserSessionState => {
    return {
      ...state,
      spApplications: [...state.spApplications, spApp],
    };
  }),
  on(UserSessionActions.withdrawSpApplicationSuccess, (state, { deletedId }): UserSessionState => {
    return {
      ...state,
      spApplications: state.spApplications.filter((s) => s.id !== deletedId),
    };
  }),
  /*
      _   _ ___ 
     | | | |_ _|
     | |_| || | 
      \___/|___|
                
  */
  on(UserSessionActions.toggleNavTabs, (state, { on }): UserSessionState => {
    if (on) {
      localStorage.removeItem('navTabs');
    } else {
      localStorage.setItem('navTabs', 'off');
    }
    return {
      ...state,
      navTabs: on,
    };
  }),
  on(UserSessionActions.sideMenuBehavior, (state, { behavior }): UserSessionState => {
    localStorage.setItem('sideMenuBehavior', behavior);
    return {
      ...state,
      sideMenuBehavior: behavior,
    };
  }),
  on(UserSessionActions.finishJoyrideSuccess, (state): UserSessionState => {
    return {
      ...state,
      joyride: false,
    };
  }),
  /*
       ___         ___          __ _ _     
      / __|_ __   | _ \_ _ ___ / _(_) |___ 
     | (__| '  \  |  _/ '_/ _ \  _| | / -_)
      \___|_|_|_| |_| |_| \___/_| |_|_\___|
                                           
  */
  on(CmProfileActions.editCmProfileSuccess, (state, { changeMaker }): UserSessionState => {
    return {
      ...state,
      changeMaker,
    };
  }),
  on(CmProfileActions.changeCmProfilePicSuccess, (state, { changeMaker }): UserSessionState => {
    return {
      ...state,
      changeMaker,
    };
  }),

  /*
      ___        ___          __ _ _     
     | __|_ __  | _ \_ _ ___ / _(_) |___ 
     | _|| '_ \ |  _/ '_/ _ \  _| | / -_)
     |___| .__/ |_| |_| \___/_| |_|_\___|
         |_|                             
  */
  on(EpProfileActions.editEpProfileSuccess, (state, { exchangePartner }): UserSessionState => {
    return {
      ...state,
      exchangeAdmins: replaceEpAdmin(state, exchangePartner),
    };
  }),
  on(EpProfileActions.changeEpLogoFileSuccess, (state, { exchangePartner }): UserSessionState => {
    return {
      ...state,
      exchangeAdmins: replaceEpAdmin(state, exchangePartner),
    };
  }),
  on(EpProfileActions.uploadEpImagesSuccess, (state, { exchangePartner }): UserSessionState => {
    return {
      ...state,
      exchangeAdmins: replaceEpAdmin(state, exchangePartner),
    };
  }),
  on(EpProfileActions.deleteEpImageSuccess, (state, { exchangePartner }): UserSessionState => {
    return {
      ...state,
      exchangeAdmins: replaceEpAdmin(state, exchangePartner),
    };
  }),
  /*
      ___        ___          __ _ _     
     / __|_ __  | _ \_ _ ___ / _(_) |___ 
     \__ \ '_ \ |  _/ '_/ _ \  _| | / -_)
     |___/ .__/ |_| |_| \___/_| |_|_\___|
         |_|                             
  */
  on(SpProfileActions.editSpProfileSuccess, (state, { servePartner }): UserSessionState => {
    return {
      ...state,
      serveAdmins: replaceSpAdmin(state, servePartner),
    };
  }),
  on(SpProfileActions.changeSpLogoFileSuccess, (state, { servePartner }): UserSessionState => {
    return {
      ...state,
      serveAdmins: replaceSpAdmin(state, servePartner),
    };
  }),
  on(SpProfileActions.uploadSpImagesSuccess, (state, { servePartner }): UserSessionState => {
    return {
      ...state,
      serveAdmins: replaceSpAdmin(state, servePartner),
    };
  }),
  on(SpProfileActions.deleteSpImageSuccess, (state, { servePartner }): UserSessionState => {
    return {
      ...state,
      serveAdmins: replaceSpAdmin(state, servePartner),
    };
  })
);

function replaceEpAdmin(
  state: UserSessionState,
  exchangePartner: UnArray<UserStoreModel['exchangeAdmins']>['exchangePartner']
) {
  const cpy = [...state.exchangeAdmins];
  const i = cpy.findIndex((ea) => ea.exchangePartner.id === exchangePartner.id);
  cpy.splice(i, 1, { ...cpy[i], exchangePartner });
  return cpy;
}

function replaceSpAdmin(
  state: UserSessionState,
  servePartner: UnArray<UserStoreModel['serveAdmins']>['servePartner']
) {
  const cpy = [...state.serveAdmins];
  const i = cpy.findIndex((ea) => ea.servePartner.id === servePartner.id);
  cpy.splice(i, 1, { ...cpy[i], servePartner });
  return cpy;
}
