import { PassportDocumentRepository } from '@involvemint/server/core/domain-services';
import {
  environment,
  ImConfig,
  ImStorageFileRoots,
  parsePassportDocumentFilePath,
} from '@involvemint/shared/domain';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import 'multer';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class StorageService {
  readonly bucket = admin.storage().bucket(environment.storageBucket);

  constructor(
    private readonly auth: AuthService,
    private readonly passportRepo: PassportDocumentRepository
  ) {}

  /**
   * Upload a file to storage.
   * @param path Includes file name and extension.
   * @param file File.
   */
  async upload(path: string, file: Express.Multer.File) {
    const gsFile = this.bucket.file(path);
    await gsFile.save(file.buffer);
  }

  async getDownloadURL(pathWithName: string) {
    const paths = pathWithName.split("/");
    if (paths[0] == "poi-images") {
      const parts = pathWithName.split(".");
      pathWithName = parts[0] + "_1080x1080." + parts[1];
    }

    const file = this.bucket.file(pathWithName);

    const urlOptions = {
      version: 'v4',
      action: 'read',
      expires: ImConfig.storageExpiration(),
    } as const;

    const [url] = await file.getSignedUrl(urlOptions);
    return url;
  }

  /**
   * @example
   * An input of `hello.png` -> `png`
   */
  extractFileExtension(filename: string) {
    return filename.substr(filename.lastIndexOf('.') + 1);
  }

  async deleteFile(pathWithName: string) {
    try {
      await this.bucket.file(pathWithName).delete();
      // eslint-disable-next-line no-empty
    } catch {}
    return pathWithName;
  }

  async authenticateFileRequest(path: string, token: string) {
    path = path.split('?')[0];

    const root = path.split('/')[0];

    switch (root) {
      /*
          ___      _    _ _
         | _ \_  _| |__| (_)__
         |  _/ || | '_ \ | / _|
         |_|  \_,_|_.__/_|_\__|

      */

      case ImStorageFileRoots.cmProfileImages:
      case ImStorageFileRoots.epLogoFiles:
      case ImStorageFileRoots.projectImages:
      case ImStorageFileRoots.poi:
      case ImStorageFileRoots.offerImages:
      case ImStorageFileRoots.requestImages:
      case ImStorageFileRoots.projectCustomWaiver:
        return this.getDownloadURL(path);

      /*
          ___                          _
         | _ \__ _ _______ __  ___ _ _| |_
         |  _/ _` (_-<_-< '_ \/ _ \ '_|  _|
         |_| \__,_/__/__/ .__/\___/_|  \__|
                        |_|
       */

      case ImStorageFileRoots.passport: {
        const user = await this.auth.validateUserToken(token, { id: true, changeMaker: { id: true } });
        const { filename } = parsePassportDocumentFilePath(path);
        const id = filename.split('.')[0];
        const doc = await this.passportRepo.findOneOrFail(id, {
          changeMaker: { id: true },
          enrollmentDocuments: {
            projectDocument: { project: { servePartner: { admins: { user: { id: true } } } } },
          },
        });

        if (
          doc.changeMaker.id === user.changeMaker?.id ||
          doc.enrollmentDocuments.some((ed) =>
            ed.projectDocument.project.servePartner.admins.some((a) => a.user.id === user.id)
          )
        ) {
          return this.getDownloadURL(path);
        }

        throw new HttpException(
          'You do not have valid permissions to view this passport document.',
          HttpStatus.UNAUTHORIZED
        );
      }
    }

    throw new HttpException('involveMINT file path not found.', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
