import { ChangeMakerRepository, HandleRepository } from '@involvemint/server/core/domain-services';
import { ExchangePartnerRepository } from '@involvemint/server/core/domain-services';
import { ServePartnerRepository } from '@involvemint/server/core/domain-services';
import {
  ChangeMaker,
  CreateChangeMakerProfileDto,
  EditCmProfileDto,
  generateChangeMakerProfileImageFilePath,
  ImStorageFileRoots,
  IQuery
} from '@involvemint/shared/domain';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as uuid from 'uuid';
import { AuthService } from '../auth/auth.service';
import { FirestoreService } from '../firestore/firestore.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ChangeMakerService {
  constructor(
    private readonly cmRepo: ChangeMakerRepository,
    private readonly exchangePartnerRepo: ExchangePartnerRepository,  
    private readonly servePartnerRepo: ServePartnerRepository,     
    private readonly auth: AuthService,
    private readonly handle: HandleRepository,
    private readonly storage: StorageService,
    private readonly firestore: FirestoreService
  ) {}

  /**
   * Creates a ChangeMaker profile and verifies handle is unique.
   * @param query query of the newly created ChangeMaker profile.
   * @param token User's auth token.
   * @param dto Essential ChangeMaker profile data.
   */
  async createProfile(query: IQuery<ChangeMaker>, token: string, dto: CreateChangeMakerProfileDto) {

    const user = await this.auth.validateUserToken(token);
    await this.handle.verifyHandleUniqueness(dto.handle);


    let existingPartnerData;
    // Fetch relevant data based on the user's role
    if (user.exchangeAdmins.length > 0) {
      const exchangePartner = user.exchangeAdmins[0].exchangePartner;
      existingPartnerData = exchangePartner; 
    } else if (user.serveAdmins.length > 0) {
      const servePartner = user.serveAdmins[0].servePartner;
      existingPartnerData = servePartner; 
    }

    // Pre-populate Changemaker profile if existing data is available
    if (existingPartnerData) {
      const [firstName, ...lastNameParts] = existingPartnerData.name.split(' ');
      const lastName = lastNameParts.join(' ') || 'N/A'; // Default to 'N/A' if last name is missing

      dto.firstName = dto.firstName || firstName;
      dto.lastName = dto.lastName || lastName;
      dto.phone = dto.phone || existingPartnerData.phone;
    }

    return this.cmRepo.upsert(
      {
        id: uuid.v4(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        handle: { id: dto.handle },
        onboardingState: dto.onboardingState === 'market' ? 'market' : 'project',
        phone: dto.phone,
        user,
        enrollments: [],
        passportDocuments: [],
        dateCreated: new Date(),
        credits: [],
        receivingTransactions: [],
        sendingTransactions: [],
        offers: [],
        requests: [],
        receivingVouchers: [],
        view: null,
      },
      query
    );
  }

  async editProfile(query: IQuery<ChangeMaker>, token: string, dto: EditCmProfileDto) {
    const user = await this.auth.validateUserToken(token, {
      id: true,
      changeMaker: { id: true, profilePicFilePath: true, handle: { id: true } },
    });

    if (!user.changeMaker) {
      throw new HttpException(
        `There is no ChangeMaker profile associated with user "${user.id}".`,
        HttpStatus.UNAUTHORIZED
      );
    }

    if (dto.profilePicFilePath === '' && user.changeMaker.profilePicFilePath) {
      this.storage.deleteFile(user.changeMaker.profilePicFilePath);
    }

    if (dto.handle?.id && user.changeMaker.handle.id !== dto.handle.id) {
      await this.firestore.changeHandleInChat(user.changeMaker.handle.id, dto.handle.id);
    }

    return this.cmRepo.update(user.changeMaker.id, dto, query);
  }

  async updateProfileImage(query: IQuery<ChangeMaker>, token: string, file: Express.Multer.File) {
    const user = await this.auth.validateUserToken(token, { id: true, changeMaker: { id: true } });

    if (!user?.changeMaker) {
      throw new HttpException(
        `No associated ChangeMaker Profile found with user "${user.id}".`,
        HttpStatus.NOT_FOUND
      );
    }

    const ext = this.storage.extractFileExtension(file.originalname);
    const name = `${user.changeMaker.id}.${ext}`;
    const path = generateChangeMakerProfileImageFilePath({
      root: ImStorageFileRoots.cmProfileImages,
      filename: name,
    });
    await this.storage.upload(path, file);

    return this.cmRepo.update(user.changeMaker.id, { profilePicFilePath: path }, query);
  }

  // This is for the frontend
  async getPrePopulatedData(token: string): Promise<{ firstName: string; lastName: string; phone: string }> {
    const user = await this.auth.validateUserToken(token);

    let existingPartnerData;
    if (user.exchangeAdmins.length > 0) {
      const exchangePartner = user.exchangeAdmins[0].exchangePartner;
      existingPartnerData = exchangePartner;
    } else if (user.serveAdmins.length > 0) {
      const servePartner = user.serveAdmins[0].servePartner;
      existingPartnerData = servePartner;
    }

    if (existingPartnerData) {
      const [firstName, ...lastNameParts] = existingPartnerData.name.split(' ');
      const lastName = lastNameParts.join(' ') || 'N/A'; 
      const phone = existingPartnerData.phone || '';

      return {
        firstName,
        lastName,
        phone,
      };
    }

    // If no existing data, return default empty values
    return {
      firstName: '',
      lastName: '',
      phone: '',
    };
  }

  
}
