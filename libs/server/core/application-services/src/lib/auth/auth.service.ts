import {
  ExchangePartnerRepository,
  HandleRepository,
  UserRepository
} from '@involvemint/server/core/domain-services';
import { environment, ImConfig, User } from '@involvemint/shared/domain';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IExactQuery, IParser, IQuery } from '@orcha/common';
import { FirebaseScrypt } from 'firebase-scrypt';

export interface Sign {
  userId: string;
}

type Token = string;

@Injectable()
export class AuthService {
  scrypt = new FirebaseScrypt(environment.scrypt);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepo: UserRepository,
    private readonly epRepo: ExchangePartnerRepository,
    private readonly handleRepo: HandleRepository
  ) {}

  /**
   * Converts an unhashed password to a hashed password so that the password is safe to store in the DB.
   * @param password Unhashed password.
   * @param salt Password salt.
   * @returns Hashed password.
   */
  createPasswordHash(password: string, salt: string) {
    return this.scrypt.hash(password, salt);
  }

  /**
   * Compares a plain text password to an hashed password. Used for login and password change purposes.
   * @param plainPassword Plain text password, sent from client.
   * @param hashedPassword Hashed password from database.
   * @param salt Password salt from database.
   * @returns True of the plain password hashes to the hashed password and false if there is a mismatch.
   */
  comparePasswordToHashed(plainPassword: string, hashedPassword: string, salt: string) {
    return this.scrypt.verify(plainPassword, salt, hashedPassword);
  }

  /**
   * Creates an authentication token from a user's email address.
   * @param signObj Object with user's email as `userId`.
   * @returns Signed authentication token.
   */
  createToken(signObj: Sign): Token {
    return this.jwtService.sign(signObj);
  }

  /**
   * Converts a user's token to the user's email address. This is used to validate a token's ownership.
   * @param token The user's token.
   * @returns Signed object with user's email address.
   */
  getTokenOwner(token: string): Promise<Sign> {
    return this.jwtService.verifyAsync(token);
  }

  /**
   * Validates the admin's token to ensure that the given token belongs only to the admin.
   * An error will be thrown if the token does not belong to the admin.
   * @param token Admin's token.
   */
  async validateAdminToken(token: string) {
    const { userId } = await this.getTokenOwner(token);
    if (userId !== ImConfig.adminEmail) {
      throw new HttpException('Access denied.', HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Authenticates a user by token.
   * @param token User auth token.
   * @returns The user entity associated with the token.
   */
  async validateUserToken(token?: string): Promise<User>;
  async validateUserToken<Q extends IQuery<User>>(
    token: string,
    query: IExactQuery<User, Q>
  ): Promise<IParser<User, Q>>;
  async validateUserToken<Q extends IQuery<User>>(token?: string, query?: IExactQuery<User, Q>) {
    if (!token) {
      throw new HttpException(
        `Unable to verify authentication token. No Token given.`,
        HttpStatus.UNAUTHORIZED
      );
    }

    let sign: Sign | undefined;

    try {
      sign = await this.getTokenOwner(token);
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!sign.userId) {
      throw new HttpException(
        `Unable to verify authentication token. No user associated with given token.`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    const user = await this.userRepo.findOneOrFail(sign.userId);
    if (!user.active && (environment.production || environment.test)) {
      throw new HttpException(`Email "${user.id}" has not been verified.`, HttpStatus.UNAUTHORIZED);
    }

    try {
      return query ? await this.userRepo.findOneOrFail(sign.userId, query) : user;
    } catch (error) {
      throw new HttpException(
        `Auth token validation failed: No user found with email "${sign.userId}".`,
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * Authenticates that a user owns a profile with id `profileId`.
   * @param profileId Profile ID of either a CM, EP, or SP.
   * @param token User auth token.
   * @returns CM, EP, or SP profile that has id `profileId`.
   */
  async authenticateFromProfileId(profileId: string | undefined, token: string) {
    const user = await this.validateUserToken(token, {
      id: true,
      active: true,
      baAdmin: true,
      changeMaker: { id: true, handle: { id: true }, phone: true, firstName: true, lastName: true },
      serveAdmins: { servePartner: { id: true, handle: { id: true }, phone: true, name: true } },
      exchangeAdmins: { exchangePartner: { id: true, handle: { id: true }, phone: true, name: true } },
    });

    if (
      !(
        user.changeMaker?.id === profileId ||
        user.serveAdmins.some((e) => e.servePartner.id === profileId) ||
        user.baAdmin ||
        user.exchangeAdmins.some((e) => e.exchangePartner.id === profileId)
      )
    ) {
      throw new HttpException(`You do not own this profile.`, HttpStatus.UNAUTHORIZED);
    }

    if (!user.active && (environment.production || environment.test)) {
      throw new HttpException(`Your email has not been verified.`, HttpStatus.UNAUTHORIZED);
    }

    const rtn = {
      changeMaker: user.changeMaker?.id === profileId ? user.changeMaker : undefined,
      exchangePartner: user.baAdmin
        ? profileId
          ? await this.epRepo.findOne(profileId, {
              id: true,
              handle: { id: true },
              phone: true,
              name: true,
            })
          : undefined
        : user.exchangeAdmins.find((e) => e.exchangePartner?.id === profileId)?.exchangePartner,
      servePartner: user.serveAdmins.find((e) => e.servePartner?.id === profileId)?.servePartner,
    };

    return {
      id: user.id,
      baAdmin: user.baAdmin,
      ...rtn,
      profileId,
      handleId:
        rtn.changeMaker?.handle.id ??
        rtn.exchangePartner?.handle.id ??
        (rtn.servePartner?.handle.id as string),
      phone: rtn.changeMaker?.phone ?? rtn.exchangePartner?.phone ?? rtn.servePartner?.phone,
      name: (rtn.changeMaker
        ? `${rtn.changeMaker.firstName} ${rtn.changeMaker.lastName}`
        : rtn.exchangePartner?.name ?? rtn.servePartner?.name) as string,
    };
  }

  /**
   * Authenticates that a user owns a profile with handle `handleId`.
   * @param handleId Handle of either a CM, EP, or SP.
   * @param token User auth token.
   * @returns CM, EP, or SP profile that has handle `handleId`.
   */
  async authenticateFromUserHandle(handleId: string, token: string) {
    const handle = await this.handleRepo.findOneOrFail(handleId, {
      changeMaker: { id: true },
      exchangePartner: { id: true },
      servePartner: { id: true },
    });

    const profileId = handle.changeMaker?.id || handle.exchangePartner?.id || handle.servePartner?.id;
    if (!profileId) {
      throw new HttpException(`No profile associated with handle "@${handleId}"`, HttpStatus.NOT_FOUND);
    }

    return this.authenticateFromProfileId(profileId, token);
  }
}
