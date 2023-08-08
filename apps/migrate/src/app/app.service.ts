import {
  ChangeMakerRepository,
  CreditRepository,
  EnrollmentDocumentRepository,
  EnrollmentRepository,
  EpApplicationRepository,
  ExchangeAdminRepository,
  ExchangePartnerRepository,
  LinkedVoucherOfferRepository,
  OfferRepository,
  PassportDocumentRepository,
  PoiRepository,
  ProjectDocumentRepository,
  ProjectRepository,
  QuestionAnswerRepository,
  QuestionRepository,
  ServeAdminRepository,
  ServePartnerRepository,
  SpApplicationRepository,
  TaskRepository,
  TransactionRepository,
  UserRepository,
  VoucherRepository,
} from '@involvemint/server/core/domain-services';
import {
  Address,
  apiEnvironment,
  ChangeMaker,
  Credit,
  Enrollment,
  EnrollmentDocument,
  environment,
  EpApplication,
  EpOnboardingState,
  ExchangeAdmin,
  ExchangePartner,
  LinkedVoucherOffer,
  Offer,
  PassportDocument,
  Poi,
  Project,
  ProjectDocument,
  Question,
  QuestionAnswer,
  ServeAdmin,
  ServePartner,
  SpApplication,
  Task,
  Transaction,
  User,
  Voucher,
} from '@involvemint/shared/domain';
import { Injectable } from '@nestjs/common';
import { IUpsertEntity } from '@orcha/common';
import * as cp from 'child_process';
import { addMonths, parseISO } from 'date-fns';
import * as fs from 'fs';
import * as geocoder from 'node-geocoder';
import { getConnection } from 'typeorm';
import * as uuid from 'uuid';

@Injectable()
export class AppService {
  constructor(
    private readonly cmRepo: ChangeMakerRepository,
    private readonly userRepo: UserRepository,
    private readonly epRepo: ExchangePartnerRepository,
    private readonly spRepo: ServePartnerRepository,
    private readonly epAppRepo: EpApplicationRepository,
    private readonly spAppRepo: SpApplicationRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly enrollmentRepo: EnrollmentRepository,
    private readonly poiRepo: PoiRepository,
    private readonly creditRepo: CreditRepository,
    private readonly transactionRepo: TransactionRepository,
    private readonly passportRepo: PassportDocumentRepository,
    private readonly projectDocRepo: ProjectDocumentRepository,
    private readonly enrollmentDocRepo: EnrollmentDocumentRepository,
    private readonly epAdminRepo: ExchangeAdminRepository,
    private readonly spAdminRepo: ServeAdminRepository,
    private readonly questionRepo: QuestionRepository,
    private readonly questionAnswerRepo: QuestionAnswerRepository,
    private readonly taskRepo: TaskRepository,
    private readonly offerRepo: OfferRepository,
    private readonly voucherRepo: VoucherRepository,
    private readonly linkedVoucherOfferRepo: LinkedVoucherOfferRepository
  ) {}

  async migrate() {
    console.log('Initializing involveMINT database migration 1.5');

    console.log('Erasing Target database...');
    await this.clearDb();

    const passwords = this.getPasswords();
    const changeMakers = this.getTableAsJson('ChangeMakers');
    const changeMakersPrivate = this.getTableAsJson('ChangeMakersPrivate');

    const getCmEmail = (cmId: string) => changeMakers.find((cm) => cm.id === cmId)?.email.replace(/\\n/g, '');

    console.log('Migrating ChangeMakers...');
    await this.cmRepo.upsertMany(
      changeMakers.map((cm): IUpsertEntity<ChangeMaker> => {
        const user = passwords.find((p) => p.email === cm.email);
        const priv = changeMakersPrivate.find((p) => p.id === cm.id);

        return {
          id: cm.id,
          firstName: cm.firstName,
          lastName: cm.lastName,
          handle: { id: cm.handle },
          bio: cm.bio,
          profilePicFilePath: cm.profilePicUrl,
          address: cm.city &&
            cm.state && {
              id: uuid.v4(),
              address1: '',
              city: cm.city,
              state: cm.state,
              zip: '',
            },
          credits: [],
          dateCreated: user?.createdAt ? new Date(Number(user.createdAt)) : new Date(),
          enrollments: [],
          offers: [],
          onboardingState: priv?.onboardingState === 'project' ? 'project' : 'none',
          passportDocuments: [],
          phone: priv?.phone ?? '',
          receivingTransactions: [],
          receivingVouchers: [],
          requests: [],
          sendingTransactions: [],
          user: cm.id,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          view: undefined!,
        };
      })
    );

    console.log('Migrating Users...');
    await this.userRepo.upsertMany(
      changeMakers
        .map((cm): IUpsertEntity<User> => {
          const user = passwords.find((p) => p.email === cm.email);

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          if (user?.passwordHash === undefined || user?.salt === undefined) return null!;

          return {
            id: cm.email,
            active: !!user.emailVerified,
            dateCreated: user?.createdAt ? new Date(Number(user.createdAt)) : new Date(),
            epApplications: [],
            exchangeAdmins: [],
            passwordHash: user.passwordHash,
            salt: user.salt,
            serveAdmins: [],
            spApplications: [],
            changeMaker: cm.id,
            joyride: true,
            baAdmin: false,
          };
        })
        .filter((u) => !!u)
    );

    console.log('Migrating ExchangePartners...');
    const spendPartner = this.getTableAsJson('SpendPartners');
    await this.epRepo.upsertMany(
      await Promise.all(
        spendPartner
          .map(async (ep): Promise<IUpsertEntity<ExchangePartner>> => {
            return {
              id: ep.id,
              address: await this.tryToGetAddress(ep.address),
              email: ep.email,
              budget: ep.budget,
              budgetEndDate: addMonths(parseISO(ep.budgetStartDate), 1),
              description: ep.description,
              logoFilePath: ep.logoImageUrl,
              handle: { id: ep.handle },
              name: ep.name,
              phone: ep.phone,
              website: ep.website,
              ein: ep.ein,
              listStoreFront: ep.listStoreFront ? 'public' : 'private',
              imagesFilePaths: ep.photoUrls,
              latitude: ep.latitude,
              longitude: ep.longitude,
              admins: [],
              credits: [],
              dateCreated: new Date(),
              offers: [],
              onboardingState: EpOnboardingState.none,
              receivingTransactions: [],
              receivingVouchers: [],
              requests: [],
              sendingTransactions: [],
              sendingVouchers: [],
              view: null,
            };
          })
          .filter((u) => !!u)
      )
    );

    console.log('Migrating ServePartners...');
    const servePartners = this.getTableAsJson('ServePartners');
    await this.spRepo.upsertMany(
      await Promise.all(
        servePartners
          .map(async (sp): Promise<IUpsertEntity<ServePartner>> => {
            return {
              id: sp.id,
              address: await this.tryToGetAddress(sp.address),
              email: sp.email,
              description: sp.description,
              dateCreated: new Date(),
              handle: { id: sp.handle },
              name: sp.name,
              phone: sp.phone,
              website: sp.website,
              logoFilePath: sp.logoImageUrl,
              admins: [],
              credits: [],
              imagesFilePaths: [],
              offers: [],
              projects: [],
              receivingTransactions: [],
              receivingVouchers: [],
              requests: [],
              sendingTransactions: [],
            };
          })
          .filter((u) => !!u)
      )
    );

    console.log('Migrating EpApplications...');
    const epApp = this.getTableAsJson('SpApplications');
    await this.epAppRepo.upsertMany(
      await Promise.all(
        epApp
          .map(async (ep): Promise<IUpsertEntity<EpApplication>> => {
            return {
              id: ep.id,
              address: await this.tryToGetAddress(ep.address),
              email: ep.email,
              dateCreated: new Date(),
              handle: { id: ep.handle },
              name: ep.name,
              phone: ep.phone,
              website: ep.website,
              ein: ep.ein,
              user: getCmEmail(ep.changeMakerId),
            };
          })
          .filter((u) => !!u)
      )
    );

    console.log('Migrating SpApplications...');
    const spApp = this.getTableAsJson('SrApplications');
    await this.spAppRepo.upsertMany(
      await Promise.all(
        spApp
          .map(async (sp): Promise<IUpsertEntity<SpApplication>> => {
            return {
              id: sp.id,
              address: await this.tryToGetAddress(sp.address),
              email: sp.email,
              dateCreated: new Date(),
              handle: { id: sp.handle },
              name: sp.name,
              phone: sp.phone,
              website: sp.website,
              user: getCmEmail(sp.changeMakerId),
            };
          })
          .filter((u) => !!u)
      )
    );

    console.log('Migrating SpendAdmins...');
    const SpendAdmins = this.getTableAsJson('SpendAdmins');
    const spa = SpendAdmins
      // .filter(
      //   (thing) =>
      //     getCmEmail(thing.changeMakerId.trim()) !== 'info@involvemint.io' &&
      //     getCmEmail(thing.changeMakerId.trim()) !== 'partnerships@involvemint.io'
      // )
      .map((e): IUpsertEntity<ExchangeAdmin> => {
        return {
          id: e.id.trim(),
          datePermitted: e.datePermitted,
          exchangePartner: e.spendPartnerId,
          superAdmin: false,
          user: getCmEmail(e.changeMakerId),
        };
      });

    for (const s of spa) {
      await this.epAdminRepo.upsert(s);
    }
    // await this.epAdminRepo.upsertMany(spa);

    console.log('Migrating ServeAdmins...');
    const ServeAdmins = this.getTableAsJson('ServeAdmins');
    const sra = ServeAdmins
      // .filter(
      //   (thing) =>
      //     getCmEmail(thing.changeMakerId.trim()) !== 'info@involvemint.io' &&
      //     getCmEmail(thing.changeMakerId.trim()) !== 'partnerships@involvemint.io'
      // )
      .map((e): IUpsertEntity<ServeAdmin> => {
        return {
          id: e.id.trim(),
          datePermitted: e.datePermitted,
          servePartner: e.servePartnerId,
          superAdmin: e.superAdmin,
          user: getCmEmail(e.changeMakerId),
        };
      });

    await this.spAdminRepo.upsertMany(sra);

    console.log('Migrating Positions...');
    const projects = this.getTableAsJson('Positions');
    await this.projectRepo.upsertMany(
      projects
        .map((p): IUpsertEntity<Project> => {
          return {
            id: p.id,
            address: {
              id: uuid.v4(),
              city: p.city,
              state: p.state,
              address1: p.address,
              zip: '',
            },
            description: p.description,
            listingStatus: p.listed ? 'public' : 'private',
            title: p.title,
            imagesFilePaths: p.photoUrls,
            servePartner: p.servePartnerId,
            startDate: p.startDate,
            endDate: p.endDate,
            requireImages: p.requirePhotos,
            requireLocation: p.requireLocation,
            maxChangeMakers: p.maxChangeMakers,
            creditsEarned: p.timeCreditsEarned,
            dateCreated: new Date(),
            dateUpdated: new Date(),
            enrollments: [],
            projectDocuments: [],
            preferredScheduleOfWork: p.preferredScheduleOfWork,
            questions: [],
            requireCustomWaiver: false,
          };
        })
        .filter((u) => !!u)
    );

    console.log('Migrating CurrentEnrollees...');
    const currentEnrollees = this.getTableAsJson('CurrentEnrollees');
    await this.enrollmentRepo.upsertMany(
      currentEnrollees
        .map((e): IUpsertEntity<Enrollment> => {
          return {
            id: e.id,
            dateApplied: e.dateApplied,
            dateApproved: e.dateApproved,
            changeMaker: e.changeMakerId,
            project: e.positionId,
            acceptedWaiver: true,
            enrollmentDocuments: [],
            pois: [],
          };
        })
        .filter((u) => !!u)
    );

    console.log('Migrating DeniedEnrollees...');
    const deniedEnrollees = this.getTableAsJson('DeniedEnrollees');
    await this.enrollmentRepo.upsertMany(
      deniedEnrollees
        .map((e): IUpsertEntity<Enrollment> => {
          return {
            id: e.id,
            dateApplied: e.dateApplied,
            dateDenied: e.dateDenied,
            changeMaker: e.changeMakerId,
            project: e.positionId,
            acceptedWaiver: true,
            enrollmentDocuments: [],
            pois: [],
          };
        })
        .filter((u) => !!u)
    );

    console.log('Migrating PendingEnrollees...');
    const PendingEnrollees = this.getTableAsJson('PendingEnrollees');
    await this.enrollmentRepo.upsertMany(
      PendingEnrollees.map((e): IUpsertEntity<Enrollment> => {
        return {
          id: e.id,
          dateApplied: e.dateApplied,
          changeMaker: e.changeMakerId,
          project: e.positionId,
          acceptedWaiver: true,
          enrollmentDocuments: [],
          pois: [],
        };
      }).filter((u) => !!u)
    );

    console.log('Migrating RetiredEnrollees...');
    const RetiredEnrollees = this.getTableAsJson('RetiredEnrollees');
    await this.enrollmentRepo.upsertMany(
      RetiredEnrollees.map((e): IUpsertEntity<Enrollment> => {
        return {
          id: e.id,
          dateApplied: e.dateApplied,
          dateApproved: e.dateApproved,
          dateRetired: e.dateRetired,
          changeMaker: e.changeMakerId,
          project: e.positionId,
          acceptedWaiver: true,
          enrollmentDocuments: [],
          pois: [],
        };
      }).filter((u) => !!u)
    );

    console.log('Migrating ApprovedProofsOfImpact...');
    const ApprovedProofsOfImpact = this.getTableAsJson('ApprovedProofsOfImpact');
    await this.poiRepo.upsertMany(
      await Promise.all(
        ApprovedProofsOfImpact.map(async (e): Promise<IUpsertEntity<Poi>> => {
          const enrollment = await this.enrollmentRepo.query(
            { id: true },
            { where: { project: e.positionId, changeMaker: e.changeMakerId } }
          );
          return {
            id: e.id,
            dateCreated: e.clockIn,
            dateStarted: e.clockIn,
            pausedTimes: e.pausedTimes,
            resumedTimes: e.resumedTimes,
            dateStopped: e.clockOut,
            imagesFilePaths: e.photoUrls,
            dateSubmitted: e.dateSubmitted,
            dateApproved: e.dateApproved,
            enrollment: enrollment[0]?.id ?? null,
            latitude: e.location?.split(',')?.[0],
            longitude: e.location?.split(',')?.[1],
            answers: [],
            credits: [],
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating DeniedProofsOfImpact...');
    const DeniedProofsOfImpact = this.getTableAsJson('DeniedProofsOfImpact');
    await this.poiRepo.upsertMany(
      await Promise.all(
        DeniedProofsOfImpact.map(async (e): Promise<IUpsertEntity<Poi>> => {
          const enrollment = await this.enrollmentRepo.query(
            { id: true },
            { where: { project: e.positionId, changeMaker: e.changeMakerId } }
          );
          return {
            id: e.id,
            dateCreated: e.clockIn,
            dateStarted: e.clockIn,
            pausedTimes: e.pausedTimes,
            resumedTimes: e.resumedTimes,
            dateStopped: e.clockOut,
            imagesFilePaths: e.photoUrls,
            dateSubmitted: e.dateSubmitted,
            dateDenied: e.dateDenied,
            enrollment: enrollment[0]?.id ?? null,
            latitude: e.location.split(',')[0],
            longitude: e.location.split(',')[1],
            answers: [],
            credits: [],
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating FinishedProofsOfImpact...');
    const FinishedProofsOfImpact = this.getTableAsJson('FinishedProofsOfImpact');
    await this.poiRepo.upsertMany(
      await Promise.all(
        FinishedProofsOfImpact.map(async (e): Promise<IUpsertEntity<Poi>> => {
          const enrollment = await this.enrollmentRepo.query(
            { id: true },
            { where: { project: e.positionId, changeMaker: e.changeMakerId } }
          );
          return {
            id: e.id,
            dateCreated: e.clockIn,
            dateStarted: e.clockIn,
            pausedTimes: e.pausedTimes,
            resumedTimes: e.resumedTimes,
            dateStopped: e.clockOut,
            imagesFilePaths: [],
            dateSubmitted: e.dateSubmitted,
            dateDenied: e.dateDenied,
            enrollment: enrollment[0]?.id ?? null,
            latitude: e.location.split(',')[0],
            longitude: e.location.split(',')[1],
            answers: [],
            credits: [],
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating StartedProofsOfImpact...');
    const StartedProofsOfImpact = this.getTableAsJson('StartedProofsOfImpact');
    await this.poiRepo.upsertMany(
      await Promise.all(
        StartedProofsOfImpact.map(async (e): Promise<IUpsertEntity<Poi>> => {
          const enrollment = await this.enrollmentRepo.query(
            { id: true },
            { where: { project: e.positionId, changeMaker: e.changeMakerId } }
          );
          return {
            id: e.id,
            dateCreated: e.clockIn,
            dateStarted: e.clockIn,
            pausedTimes: e.pausedTimes,
            resumedTimes: e.resumedTimes,
            imagesFilePaths: [],
            enrollment: enrollment[0]?.id ?? null,
            latitude: e.location.split(',')[0],
            longitude: e.location.split(',')[1],
            answers: [],
            credits: [],
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating SubmittedProofsOfImpact...');
    const SubmittedProofsOfImpact = this.getTableAsJson('SubmittedProofsOfImpact');
    await this.poiRepo.upsertMany(
      await Promise.all(
        SubmittedProofsOfImpact.map(async (e): Promise<IUpsertEntity<Poi>> => {
          const enrollment = await this.enrollmentRepo.query(
            { id: true },
            { where: { project: e.positionId, changeMaker: e.changeMakerId } }
          );
          return {
            id: e.id,
            dateCreated: e.clockIn,
            dateStarted: e.clockIn,
            pausedTimes: e.pausedTimes,
            resumedTimes: e.resumedTimes,
            dateStopped: e.clockOut,
            imagesFilePaths: e.photoUrls,
            dateSubmitted: e.dateSubmitted,
            enrollment: enrollment[0]?.id ?? null,
            latitude: e.location.split(',')[0],
            longitude: e.location.split(',')[1],
            answers: [],
            credits: [],
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating Credits...');
    const Credits = this.getTableAsJson('Credits');
    await this.creditRepo.upsertMany(
      await Promise.all(
        Credits.map(async (e): Promise<IUpsertEntity<Credit>> => {
          const cm = await this.cmRepo.findOne(e.ownerId);
          const ep = await this.epRepo.findOne(e.ownerId);
          const sp = await this.spRepo.findOne(e.ownerId);
          return {
            id: e.id,
            amount: e.amount,
            dateMinted: e.dateMinted,
            poi: e.approvedPOIId,
            escrow: e.escrow,
            changeMaker: cm ? cm.id : undefined,
            exchangePartner: ep?.id,
            servePartner: sp?.id,
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating Transactions...');
    const Transactions = this.getTableAsJson('Transactions');
    await this.transactionRepo.upsertMany(
      await Promise.all(
        Transactions.map(async (e): Promise<IUpsertEntity<Transaction>> => {
          const cmR = await this.cmRepo.findOne(e.receiverId);
          const epR = await this.epRepo.findOne(e.receiverId);
          const spR = await this.spRepo.findOne(e.receiverId);
          const cmS = await this.cmRepo.findOne(e.senderId);
          const epS = await this.epRepo.findOne(e.senderId);
          const spS = await this.spRepo.findOne(e.senderId);
          return {
            id: e.id,
            amount: e.amount,
            dateTransacted: e.date,
            memo: e.memo,
            receiverChangeMaker: cmR ? cmR.id : undefined,
            receiverExchangePartner: epR,
            receiverServePartner: spR,
            epAudibleCode: e.spAudibleCode,
            senderChangeMaker: cmS ? cmS.id : undefined,
            senderExchangePartner: epS,
            senderServePartner: spS,
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating PassportDocuments...');
    const PassportDocuments = this.getTableAsJson('PassportDocuments');
    await this.passportRepo.upsertMany(
      await Promise.all(
        PassportDocuments.map(async (e): Promise<IUpsertEntity<PassportDocument>> => {
          return {
            id: e.id,
            changeMaker: e.changeMakerId,
            enrollmentDocuments: [],
            filePath: e.url,
            name: e.name,
            uploadedDate: e.uploadedDate,
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating PositionDocuments...');
    const ProjectDocuments = this.getTableAsJson('PositionDocuments');
    await this.projectDocRepo.upsertMany(
      await Promise.all(
        ProjectDocuments.map(async (e): Promise<IUpsertEntity<ProjectDocument>> => {
          return {
            id: e.id,
            title: e.title,
            description: e.description,
            infoUrl: e.infoUrl,
            project: e.positionId,
            enrollmentDocuments: [],
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating EnrolleeDocuments...');
    const EnrolleeDocuments = this.getTableAsJson('EnrolleeDocuments');
    await this.enrollmentDocRepo.upsertMany(
      await Promise.all(
        EnrolleeDocuments.map(async (e): Promise<IUpsertEntity<EnrollmentDocument>> => {
          return {
            id: e.id,
            enrollment:
              e.pendingEnrolleeId || e.currentEnrolleeId || e.deniedEnrolleeId || e.retiredEnrolleeId,
            passportDocument: e.passportDocumentId,
            projectDocument: e.positionDocumentId,
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating Questions...');
    const Questions = this.getTableAsJson('Questions');
    await this.questionRepo.upsertMany(
      await Promise.all(
        Questions.map(async (e): Promise<IUpsertEntity<Question>> => {
          return {
            id: e.id,
            project: e.positionId,
            answers: [],
            text: e.text,
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating QuestionAnswers...');
    const QuestionAnswers = this.getTableAsJson('QuestionAnswers');
    await this.questionAnswerRepo.upsertMany(
      await Promise.all(
        QuestionAnswers.map(async (e): Promise<IUpsertEntity<QuestionAnswer>> => {
          return {
            id: e.id,
            answer: e.answer,
            question: e.questionId,
            poi: e.submittedId || e.approvedId || e.deniedId,
            dateAnswered: new Date(),
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating Tasks...');
    const Tasks = this.getTableAsJson('Tasks');
    await this.taskRepo.upsertMany(
      await Promise.all(
        Tasks.map(async (e): Promise<IUpsertEntity<Task>> => {
          return {
            id: e.id,
            poi: e.startedPoiId,
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating CmOffers...');
    const CmOffers = this.getTableAsJson('CmOffers');
    await this.offerRepo.upsertMany(
      await Promise.all(
        CmOffers.map(async (e): Promise<IUpsertEntity<Offer>> => {
          return {
            id: e.id,
            name: e.title,
            description: e.description,
            dateCreated: e.dateListed,
            dateUpdated: e.dateListed,
            imagesFilePaths: e.photoUrls,
            changeMaker: e.changeMakerId,
            address: e.address && {
              id: uuid.v4(),
              address1: e.address,
              city: e.city,
              state: e.state,
              zip: '',
            },
            listingStatus: e.listed ? 'public' : 'private',
            price: e.price,
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating SpOffers...');
    const SpOffers = this.getTableAsJson('SpOffers');
    await this.offerRepo.upsertMany(
      await Promise.all(
        SpOffers.map(async (e): Promise<IUpsertEntity<Offer>> => {
          return {
            id: e.id,
            name: e.name,
            description: e.description,
            dateCreated: e.dateListed,
            dateUpdated: e.dateListed,
            imagesFilePaths: [e.imageUrl],
            exchangePartner: e.spendPartnerId,
            address: await this.tryToGetAddress(e.address),
            listingStatus: e.listed ? 'public' : 'private',
            price: e.price,
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Migrating Vouchers...');
    const Vouchers = this.getTableAsJson('Vouchers');
    await this.voucherRepo.upsertMany(
      await Promise.all(
        Vouchers.map(async (e): Promise<IUpsertEntity<Voucher>> => {
          const cm = await this.cmRepo.findOne(e.buyerId);
          const ep = await this.epRepo.findOne(e.buyerId);
          const sp = await this.spRepo.findOne(e.buyerId);
          return {
            id: e.id,
            code: e.code,
            dateCreated: e.dateCreated,
            amount: e.amount,
            seller: e.spendPartnerId,
            dateExpires: e.dateExpires,
            dateRedeemed: e.dateRedeemed,
            dateArchived: e.dateArchived,
            dateRefunded: e.dateRefunded,
            offers: [],
            changeMakerReceiver: cm?.id,
            exchangePartnerReceiver: ep?.id,
            servePartnerReceiver: sp?.id,
          };
        }).filter((u) => !!u)
      )
    );
    console.log('Migrating VoucherSpOffers...');
    const VoucherSpOffers = this.getTableAsJson('VoucherSpOffers');
    await this.linkedVoucherOfferRepo.upsertMany(
      await Promise.all(
        VoucherSpOffers.map(async (e): Promise<IUpsertEntity<LinkedVoucherOffer>> => {
          return {
            id: e.id,
            voucher: e.voucherId,
            offer: e.spOfferId,
            quantity: e.quantity,
          };
        }).filter((u) => !!u)
      )
    );

    console.log('Done');
  }

  async clearDb() {
    const connection = getConnection();
    const entities = connection.entityMetadatas;
    for (const entity of entities) {
      const repository = connection.getRepository(entity.name);
      try {
        await repository.query(`TRUNCATE "${entity.tableName}" CASCADE`);
      } catch {
        return;
      } // ignore trying to delete views
    }
  }

  getPasswords(): {
    localId: string;
    email: string;
    emailVerified: boolean;
    passwordHash?: string;
    salt?: string;
    lastSignedInAt?: string;
    createdAt: string;
    providerUserInfo: [];
  }[] {
    const pw = fs.readFileSync('apps/migrate/src/app/pw.json');
    return JSON.parse(pw.toString()).users;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTableAsJson(tableName: string): Array<Record<string, any>> {
    const output = cp.execSync(
      `psql -h localhost -d postgres -U postgres -p 5432 -q -c  "COPY (SELECT row_to_json(t) FROM \\"${tableName}\\" as t) to STDOUT"`
    );
    const correctJsonSyntax = `[${output.toString().replace(/\n/g, ',').slice(0, -1)}]`;
    try {
      return JSON.parse(correctJsonSyntax);
    } catch (error) {
      console.error('Could not parse:', correctJsonSyntax);
      throw new Error(error);
    }
  }

  async tryToGetAddress(address: string): Promise<Address | null> {
    if (!address) {
      return null;
    }

    const geo = geocoder.default({ provider: 'google', apiKey: apiEnvironment.gcpApiKey });
    const res = await geo.geocode(address);

    const a = res[0];

    if (!a) {
      return {
        id: uuid.v4(),
        address1: '',
        city: '',
        state: '',
        zip: '',
      };
    }

    return {
      id: uuid.v4(),
      address1: `${a.streetNumber} ${a.streetName}`,
      city: a.city ?? '',
      state: a.administrativeLevels?.level1short ?? '',
      zip: a.zipcode ?? '',
    };
  }
}
