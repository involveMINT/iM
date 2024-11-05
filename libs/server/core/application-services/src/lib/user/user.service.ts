/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ExchangePartnerRepository, UserRepository } from '@involvemint/server/core/domain-services';
import {
  ActivateUserAccountDto,
  AdminUserSearchDto,
  ChangePasswordDto,
  defaultStorefrontListingStatus,
  environment,
  GrantBaPrivilegesDto,
  ImConfig,
  ISnoopData,
  RevokeBaPrivilegesDto,
  SearchUserDto,
  SignUpDto,
  SnoopDto,
  User
} from '@involvemint/shared/domain';
import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { IQuery, parseQuery } from '@orcha/common';
import { addMonths } from 'date-fns';
import { first } from 'rxjs/operators';
import { Raw } from 'typeorm';
import * as uuid from 'uuid';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly auth: AuthService,
    private readonly email: EmailService,
    private readonly httpService: HttpService,
    private readonly epRepo: ExchangePartnerRepository
  ) { }

  async verifyUserEmail(email: string): Promise<boolean> {
    const user = await this.userRepo.findOne(email, { id: true });
    return user?.id ? false : true;
  }

  /**
   * Initiates an involveMINT user's sign up sequence.
   * @param id User email address.
   * @param password User password.
   * @param query Orcha query of the user's signed token.
   */
  async signUp(dto: SignUpDto, query: IQuery<{ token: string }>) {
    const conflictingUser = await this.userRepo.findOne(dto.id, { id: true });

    /* Checks */

    if (conflictingUser?.id) {
      throw new HttpException(`User with email "${conflictingUser.id}" already exists.`, HttpStatus.CONFLICT);
    }

    /* Sign Up */

    const activationHash = uuid.v4();
    const salt = uuid.v4();
    const passwordHash = await this.auth.createPasswordHash(dto.password, salt);
    await this.userRepo.upsert(
      {
        id: dto.id,
        passwordHash,
        salt,
        dateCreated: new Date(),
        active: false,
        activationHash: activationHash,
        epApplications: [],
        exchangeAdmins: [],
        serveAdmins: [],
        spApplications: [],
        joyride: true,
        baAdmin: false,
        activityPosts: [],
        likes: [],
        comments: [],
        updatedAt: new Date(),
        flags: []
      },
      {}
    );
    await this.email.sendEmailVerification(dto.id, activationHash, dto.registerAs);
    const token = this.auth.createToken({ userId: dto.id });
    return parseQuery(query, { token });
  }

  /**
   * Initiates an involveMINT user's login sequence.
   * @param id User email address.
   * @param password User password.
   * @param query Orcha query of the user's signed token.
   */
  async login(id: string, password: string, query: IQuery<{ token: string }>) {
    const user = await this.userRepo.findOne(id);

    /* Checks */

    if (!user) {
      throw new HttpException(`User "${id}" does not exist.`, HttpStatus.NOT_FOUND);
    }
    const compare = await this.auth.comparePasswordToHashed(password, user.passwordHash, user.salt);
    if (!compare) {
      throw new HttpException(`Incorrect password.`, HttpStatus.UNAUTHORIZED);
    }
    if (!user.active && (environment.production || environment.test)) {
      throw new HttpException(`User ${user.id} has not been verified.`, HttpStatus.UNAUTHORIZED);
    }

    /* Login */

    // If user correctly logs in, then don't allow for password reset.
    await this.userRepo.update(user.id, { forgotPasswordHash: null!, dateLastLoggedIn: user.updatedAt });

    // Generate token with the user's email as the token's hash to later verify a token's owner.
    const token = this.auth.createToken({ userId: id });
    return parseQuery(query, { token });
  }

  /**
   *  Initiates the involveMINT Super Admin's login sequence.
   * @param password Admin's password (found in environment variables).
   * @param query Orcha query of the admins's signed token.
   */
  async adminLogin(password: string, query: IQuery<{ token: string }>) {
    const compare = await this.auth.comparePasswordToHashed(password, environment.adminPasswordHash, '');
    if (!compare) {
      throw new HttpException(`Username or password incorrect.`, HttpStatus.UNAUTHORIZED);
    }
    return parseQuery(query, { token: this.auth.createToken({ userId: ImConfig.adminEmail }) });
  }

  /**
   * Validates the admin's token to ensure that the given token belongs only to the admin.
   * An error will be thrown if the token does not belong to the admin.
   * @param token Admin's token.
   * @returns Orcha query of inputted token.
   */
  async validateAdminToken(query: IQuery<{ token: string }>, token: string) {
    await this.auth.validateAdminToken(token);
    return parseQuery(query, { token });
  }

  /**
   * Validates a user's auth token and returns session data from the user associated with the token.
   * @param query Orcha query of desired user data for the involveMINT client session.
   * @param token User's auth token.
   * @returns The user's desired session data from the user associated with the token.
   */
  async getUserData(query: IQuery<User>, token: string) {
    return this.auth.validateUserToken(token, query);
  }

  /**
   * Business Admin initiates an involveMINT user's sign up sequence.
   * @param baAdminName Business admin's name.
   * @param baAdminEmail Business admin's email address.
   * @param userId New user id/email.
   * @param epId New EP ID to be included in the email send to user to activate account and update
   *        EP listStoreFront status.
   */
  async baSignUp(baAdminName: string | undefined, baAdminEmail: string, newUserId: string, newEpId: string) {
    const conflictingUser = await this.userRepo.findOne(newUserId, { id: true });

    if (conflictingUser?.id) {
      throw new HttpException(`User with email "${conflictingUser.id}" already exists.`, HttpStatus.CONFLICT);
    }

    const activationHash = uuid.v4();
    const temporaryPassword = uuid.v4();
    const salt = uuid.v4();
    const passwordHash = await this.auth.createPasswordHash(temporaryPassword, salt);
    const forgotPasswordHash = uuid.v4();
    const newUser = await this.userRepo.upsert(
      {
        id: newUserId,
        passwordHash,
        salt,
        dateCreated: new Date(),
        active: false,
        activationHash,
        forgotPasswordHash,
        epApplications: [],
        exchangeAdmins: [],
        serveAdmins: [],
        spApplications: [],
        joyride: true,
        baAdmin: false,
        activityPosts: [],
        likes: [],
        comments: [],
        flags: [],
        updatedAt: new Date(),
      },
      { id: true }
    );
    await this.email.sendActivateBusinessUserAccount(
      baAdminName,
      baAdminEmail,
      newUserId,
      newEpId,
      activationHash,
      temporaryPassword,
      forgotPasswordHash
    );
    return newUser;
  }

  /**
   * * Admin only
   * Allows the super admin to login as any user.
   * @param query Orcha query for user session data the admin wants to snoop on.
   * @param token Admin's auth token.
   * @param dto User email of the user the admin is to snoop on.
   */
  async snoop(query: IQuery<ISnoopData>, token: string, dto: SnoopDto) {
    await this.validateAdminToken({}, token);
    const data = await this.userRepo.findOneOrFail(dto.userId, query as IQuery<Omit<ISnoopData, 'token'>>);
    const userToken = this.auth.createToken({ userId: dto.userId });
    return { ...data, token: userToken } as any; // TODO
  }

  /**
   * * Admin only
   * Allows the super admin to get all users with privileges.
   * @param query Orcha query of all users with privileges.
   * @param token Admin's auth token.
   */
  async getAllUserPrivileges(query: IQuery<User[]>, token: string) {
    await this.validateAdminToken({}, token);
    return this.userRepo.query(query, { where: { baAdmin: true } });
  }

  /**
   * * Admin only
   * Allows the super admin to grant BA privileges.
   * @param query Orcha query of user with granted baAdmin privilege.
   * @param token The admin's authentication token.
   * @param dto User's Id to grant BA privileges
   */
  async grantBAPrivilege(query: IQuery<User>, token: string, dto: GrantBaPrivilegesDto) {
    await this.validateAdminToken({}, token);
    return this.userRepo.update(dto.id, { baAdmin: true }, query);
  }

  /**
   * * Admin only
   * Allows the super admin to revoke BA privileges.
   * @param query Orcha query of user with revoked baAdmin privilege.
   * @param token The admin's authentication token.
   * @param dto User's Id to revoke BA privileges
   */
  async revokeBAPrivilege(query: IQuery<User>, token: string, dto: RevokeBaPrivilegesDto) {
    await this.validateAdminToken({}, token);
    return this.userRepo.update(dto.id, { baAdmin: false }, query);
  }

  /**
   * Search all user's given an email search string criteria.
   * @param query Orcha query of searched users.
   * @param dto User search criteria.
   */
  async searchUsers(query: IQuery<User[]>, dto: SearchUserDto) {
    return this.userRepo.query(query, {
      where: {
        id: Raw((alias) => `${alias} ILIKE '%${dto.emailSearchString}%'`),
      },
    });
  }

  /**
   * ***BA Admin only***
   *
   * Activate a user's account with activation hash, temporary password, and forgot password sent to the new
   * user's email when baAdmin created the business account. And create a new password for the user account with
   * the new password passed in.
   * @param dto ActivateUserAccountDto
   *    - email User email address.
   *    - epId EP Id associate with the user email address, used to update listStoreFront status
   *    - activationHash The hash contained in the email sent to the user's email address.
   *    - temporaryPassword User's current temporary password set when baAdmin created the user
   *    - forgotPasswordHash Forgot Password hash set when baAdmin created the user.
   *    - password User's new password
   */
  async activateUserAccount(dto: ActivateUserAccountDto) {
    const user = await this.userRepo.findOneOrFail(dto.email);
    if (!user) {
      throw new HttpException(
        `Email "${dto.email}" has no associated involveMINT user.`,
        HttpStatus.NOT_FOUND
      );
    }
    if (user.activationHash !== dto.activationHash || user.forgotPasswordHash !== dto.forgotPasswordHash) {
      throw new HttpException(
        `The given verification hash does not match the user "${dto.email}".`,
        HttpStatus.UNAUTHORIZED
      );
    }
    const compare = await this.auth.comparePasswordToHashed(
      dto.temporaryPassword,
      user.passwordHash,
      user.salt
    );
    if (!compare) {
      throw new HttpException(
        `The given verification hash does not match the user "${dto.email}".`,
        HttpStatus.UNAUTHORIZED
      );
    }
    const ep = await this.epRepo.findOneOrFail(dto.epId, { id: true, admins: { user: { id: true } } });
    if (ep.admins.findIndex((admin) => admin.user.id === dto.email) === -1) {
      throw new HttpException(
        `The given ExchangePartner "${dto.epId}" does not match the user email "${dto.email}".`,
        HttpStatus.UNAUTHORIZED
      );
    }

    const newSalt = uuid.v4();
    const newPasswordHash = await this.auth.createPasswordHash(dto.newPassword, newSalt);
    const newDate = new Date();
    await this.userRepo.update(dto.email, {
      active: true,
      activationHash: null!,
      salt: newSalt,
      passwordHash: newPasswordHash,
      forgotPasswordHash: null!,
      dateCreated: newDate,
    });
    environment.production && this.addUserToMailChimpGeneralAudience(dto.email);

    // update EP listStoreFront status, budgetEndDate (re-calculate budgetEndDate on user activation since
    // it was created by a baAdmin) and dateCreated (insert a new dateCreated since it was created by a baAdmin)
    await this.epRepo.update(ep.id, {
      listStoreFront: defaultStorefrontListingStatus,
      budgetEndDate: addMonths(newDate, 1),
      dateCreated: newDate,
    });

    return {};
  }

  /**
   * Resend email verification. Note the activation hash used to validate is regenerated.
   * @param email User email address.
   */
  async resendEmailVerificationEmail(email: string) {
    const user = await this.userRepo.findOneOrFail(email);

    if (user.active) {
      throw new HttpException(`User "${email}" already verified.`, HttpStatus.BAD_REQUEST);
    }

    const newHash = uuid.v4();
    await this.userRepo.update(email, { activationHash: newHash });

    await this.email.sendEmailVerification(user.id, newHash);
    return {};
  }

  /**
   * Initiates a user's email verification check.
   * @param email User email address.
   * @param activationHash The hash contained in the email sent to the user's email address.
   */
  async verifyEmail(email: string, activationHash: string) {
    const user = await this.userRepo.findOneOrFail(email);

    if (user.active) {
      throw new HttpException(`User "${email}" is already verified.`, HttpStatus.BAD_REQUEST);
    }

    if (activationHash !== user.activationHash) {
      throw new HttpException(
        `The given verification hash does not match the user "${email}".`,
        HttpStatus.BAD_REQUEST
      );
    }

    await this.userRepo.update(email, { active: true, activationHash: null! });
    environment.production && this.addUserToMailChimpGeneralAudience(email);
    return {};
  }

  /**
   * Sends a forgot password email.
   * @param email User email address.
   */
  async forgotPassword(email: string) {
    const user = await this.userRepo.findOne(email);

    if (!user) {
      throw new HttpException(`Email "${email}" has no associated involveMINT user.`, HttpStatus.NOT_FOUND);
    }

    const forgotPasswordHash = uuid.v4();
    await this.userRepo.update(email, { active: true, forgotPasswordHash });
    await this.email.sendForgotPassword(email, forgotPasswordHash);
    return {};
  }

  /**
   * Changes a user's password if the given hash matches the one sent to the user's email address.
   * @param email User email address.
   * @param password User's new password
   * @param forgotPasswordHash Forgot Password hash sent to the user's email address.
   */
  async forgotPasswordChange(email: string, password: string, forgotPasswordHash: string) {
    const user = await this.userRepo.findOneOrFail(email);

    if (!user.forgotPasswordHash) {
      throw new HttpException(
        `User "${email}" has not requested to reset their password or has already been reset.`,
        HttpStatus.BAD_REQUEST
      );
    }
    if (user.forgotPasswordHash !== forgotPasswordHash) {
      throw new HttpException(
        `The given verification hash does not match the user "${email}".`,
        HttpStatus.UNAUTHORIZED
      );
    }

    const salt = uuid.v4();
    const passwordHash = await this.auth.createPasswordHash(password, salt);
    await this.userRepo.update(email, {
      active: true,
      forgotPasswordHash: null!,
      activationHash: null!,
      passwordHash,
      salt,
    });
    return {};
  }

  /**
   * Changes a user's password if the given current password matches the unhashed password in the DB.
   * @param token The user's authentication token.
   * @param dto Current and old password.
   */
  async changePassword(token: string, dto: ChangePasswordDto) {
    const { id, passwordHash, salt } = await this.auth.validateUserToken(token);

    const compare = await this.auth.comparePasswordToHashed(dto.currentPassword, passwordHash, salt);
    if (!compare) {
      throw new HttpException(`Incorrect current password.`, HttpStatus.UNAUTHORIZED);
    }

    const newSalt = uuid.v4();
    const newPasswordHash = await this.auth.createPasswordHash(dto.newPassword, newSalt);
    await this.userRepo.update(id, {
      active: true,
      forgotPasswordHash: null!,
      passwordHash: newPasswordHash,
      salt: newSalt,
    });
    return {};
  }

  async finishJoyride(token: string) {
    const user = await this.auth.validateUserToken(token);
    return this.userRepo.update(user.id, { joyride: false });
  }

  private addUserToMailChimpGeneralAudience(email: string) {
    // User must update their email preferences with MailChimp profile information
    const mailchimpInstance = 'The Instance';
    const listUniqueId = 'Some List ID';
    const mailchimpApiKey = 'Some API Key';
    return this.httpService
      .post(
        `https://${mailchimpInstance}.api.mailchimp.com/3.0/lists/${listUniqueId}/members/`,
        {
          email_address: email,
          status: 'subscribed',
          merge_fields: {
            NAME: email,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
            Authorization: `Basic ${Buffer.from(`any:${mailchimpApiKey}`).toString('base64')}`,
          },
        }
      )
      .pipe(first())
      .toPromise();
  }

  async adminUserSearch(query: IQuery<User[]>, token: string, dto: AdminUserSearchDto) {
    await this.auth.validateAdminToken(token);
    const q = Raw((alias) => `${alias} ILIKE '%${dto.searchStr}%'`);
    return this.userRepo.query(query, {
      where: [
        {
          id: q,
        },
        {
          changeMaker: {
            handle: q,
          },
        },
      ],
    });
  }
}
