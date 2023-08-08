import { ExchangePartnerRepository } from '@involvemint/server/core/domain-services';
import {
  apiEnvironment,
  DeleteEpImageDto,
  EditEpProfileDto,
  environment,
  ExchangePartner,
  ExchangePartnerMarketQueryDto,
  generateExchangePartnerImageFilePath,
  generateExchangePartnerLogoFilePath,
  GetOneExchangePartnerDto,
  ImStorageFileRoots,
  SearchEpDto,
  UpdateEpLogoFileDto,
  UploadEpImagesDto,
} from '@involvemint/shared/domain';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IQuery } from '@orcha/common';
import * as geocoder from 'node-geocoder';
import { Raw } from 'typeorm';
import * as uuid from 'uuid';
import { AuthService } from '../auth/auth.service';
import { FirestoreService } from '../firestore/firestore.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ExchangePartnerService {
  constructor(
    private readonly epRepo: ExchangePartnerRepository,
    private readonly auth: AuthService,
    private readonly storage: StorageService,
    private readonly firestore: FirestoreService
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async query(query: IQuery<ExchangePartner[]>, dto: ExchangePartnerMarketQueryDto) {
    // TODO dto
    const g = await this.epRepo.query(query, { where: { listStoreFront: 'public' } });
    return g;
  }

  async getOne(query: IQuery<ExchangePartner>, dto: GetOneExchangePartnerDto) {
    return this.epRepo.findOneOrFail(dto.epId, query);
  }

  async searchEps(query: IQuery<ExchangePartner>, dto: SearchEpDto) {
    return this.epRepo.query(query, {
      where: [
        { email: Raw((alias) => `${alias} ILIKE '%${dto.epSearchString}%'`) },
        { handle: Raw((alias) => `${alias} ILIKE '%${dto.epSearchString}%'`) },
        { name: Raw((alias) => `${alias} ILIKE '%${dto.epSearchString}%'`) },
      ],
    });
  }

  async editProfile(query: IQuery<ExchangePartner>, token: string, dto: EditEpProfileDto) {
    await this.auth.authenticateFromProfileId(dto.epId, token);

    const ep = await this.epRepo.findOneOrFail(dto.epId, {
      logoFilePath: true,
      view: { receivedThisMonth: true },
      handle: { id: true },
    });

    if (typeof dto.changes.budget === 'number' && dto.changes.budget < ep.view.receivedThisMonth) {
      throw new HttpException(
        'Budget cannot be less than the total amount of received credits for the budget month.',
        HttpStatus.CONFLICT
      );
    }

    const logoFilePath = ep.logoFilePath;

    if (dto.changes.logoFilePath === '' && logoFilePath) {
      this.storage.deleteFile(logoFilePath);
    }

    if (dto.changes.handle?.id && ep.handle.id !== dto.changes.handle.id) {
      await this.firestore.changeHandleInChat(ep.handle.id, dto.changes.handle.id);
    }

    if (dto.changes.address) {
      const geo = geocoder.default({ provider: 'google', apiKey: apiEnvironment.gcpApiKey });
      const res = await geo.geocode(Object.entries(dto.changes.address).join(' '));
      dto.changes.latitude = Number(res[0]?.latitude?.toFixed(4));
      dto.changes.longitude = Number(res[0]?.longitude?.toFixed(4));
    }

    return this.epRepo.update(dto.epId, dto.changes, query);
  }

  async updateLogoFile(
    query: IQuery<ExchangePartner>,
    token: string,
    dto: UpdateEpLogoFileDto,
    file: Express.Multer.File
  ) {
    await this.auth.authenticateFromProfileId(dto.epId, token);

    const ext = this.storage.extractFileExtension(file.originalname);
    const name = `${dto.epId}.${ext}`;
    const path = generateExchangePartnerLogoFilePath({
      root: ImStorageFileRoots.epLogoFiles,
      filename: name,
    });
    await this.storage.upload(path, file);

    return this.epRepo.update(dto.epId, { logoFilePath: path }, query);
  }

  async uploadImages(
    query: IQuery<ExchangePartner>,
    token: string,
    dto: UploadEpImagesDto,
    files: Express.Multer.File[]
  ) {
    await this.auth.authenticateFromProfileId(dto.epId, token);

    const ep = await this.epRepo.findOneOrFail(dto.epId, {
      imagesFilePaths: true,
    });

    const imagesFilePaths = await Promise.all(
      files.map(async (file) => {
        const ext = this.storage.extractFileExtension(file.originalname);
        const filename = `${uuid.v4()}.${ext}`;
        const path = generateExchangePartnerImageFilePath({
          root: ImStorageFileRoots.projectImages,
          epId: dto.epId,
          filename,
        });
        await this.storage.upload(path, file);
        return path;
      })
    );

    return this.epRepo.update(
      dto.epId,
      { imagesFilePaths: [...(ep.imagesFilePaths || []), ...imagesFilePaths] },
      query
    );
  }

  async deleteImage(query: IQuery<ExchangePartner>, token: string, dto: DeleteEpImageDto) {
    await this.auth.authenticateFromProfileId(dto.epId, token);

    const ep = await this.epRepo.findOneOrFail(dto.epId, {
      imagesFilePaths: true,
    });

    const removed = [...(ep.imagesFilePaths || [])];
    const removedImagesFilePaths = removed.splice(dto.imagesFilePathsIndex, 1);

    this.storage.deleteFile(removedImagesFilePaths[0]);

    const newImageFilePaths: Partial<ExchangePartner> = { imagesFilePaths: removed };

    return this.epRepo.update(dto.epId, newImageFilePaths, query);
  }
}
