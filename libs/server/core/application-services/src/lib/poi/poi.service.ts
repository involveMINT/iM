import {
  CreditRepository,
  EnrollmentRepository,
  PoiRepository,
  ProjectRepository,
  QuestionAnswerRepository,
  TaskRepository,
} from '@involvemint/server/core/domain-services';
import {
  ApprovePoiDto,
  calculateCreditsEarnedForPoi,
  calculateEnrollmentStatus,
  calculatePoiMandatoryClockOutDate,
  calculatePoiStatus,
  CreatePoiDto,
  DenyPoiDto,
  EndPoiTimerDto,
  EnrollmentStatus,
  generatePoiImageFilePath,
  GetPoisByProjectDto,
  ImStorageFileRoots,
  PausePoiTimerDto,
  Poi,
  PoiStatus,
  ResumePoiTimerDto,
  StartPoiTimerDto,
  StopPoiTimerDto,
  SubmitPoiDto,
} from '@involvemint/shared/domain';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { createQuery, IQuery, parseQuery } from '@orcha/common';
import sharp from 'sharp';
import { CronJob, CronTime } from 'cron';
import * as uuid from 'uuid';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { ProjectService } from '../project/project.service';
import { StorageService } from '../storage/storage.service';
import { DbTransactionCreator } from '../transaction-creator/transaction-creator.service';

@Injectable()
export class PoiService {
  constructor(
    private readonly poiRepo: PoiRepository,
    private readonly posRepo: ProjectRepository,
    private readonly auth: AuthService,
    private readonly enrollmentRepo: EnrollmentRepository,
    private readonly storage: StorageService,
    private readonly dbTransact: DbTransactionCreator,
    private readonly qaRepo: QuestionAnswerRepository,
    private readonly posService: ProjectService,
    private readonly creditRepo: CreditRepository,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly taskRepo: TaskRepository,
    private readonly email: EmailService
  ) {}

  async get(query: IQuery<Poi[]>, token: string) {
    const user = await this.auth.validateUserToken(token ?? '', { id: true, changeMaker: { id: true } });

    if (!user?.changeMaker) {
      throw new HttpException(
        `No associated ChangeMaker Profile found with user "${user.id}".`,
        HttpStatus.NOT_FOUND
      );
    }

    return this.poiRepo.findPoisByCm(user.changeMaker.id, query);
  }

  async getByProject(query: IQuery<Poi[]>, token: string, dto: GetPoisByProjectDto) {
    const user = await this.auth.validateUserToken(token ?? '', {
      changeMaker: { enrollments: { id: true, project: { id: true, servePartner: { id: true } } } },
    });
    const project = await this.posRepo.findOneOrFail(dto.projectId, { servePartner: { id: true } });

    if (
      this.posService.permissions.userIsServeAdmin(token, project.servePartner.id) ||
      user.changeMaker?.enrollments.some((e) => e.project.id === dto.projectId)
    ) {
      return this.poiRepo.findPoisByProject(dto.projectId, query);
    }

    throw new HttpException('You cannot access these Proofs of Impact.', HttpStatus.UNAUTHORIZED);
  }

  async create(query: IQuery<Poi>, token: string, dto: CreatePoiDto) {
    const user = await this.auth.validateUserToken(token ?? '', { changeMaker: { id: true } });
    const enrollment = await this.enrollmentRepo.findOneOrFail(dto.enrollmentId, {
      dateApplied: true,
      dateApproved: true,
      dateDenied: true,
      dateRetired: true,
      dateSubmitted: true,
      changeMaker: { id: true },
      acceptedWaiver: true,
    });

    if (user.changeMaker?.id !== enrollment.changeMaker.id) {
      throw new HttpException(
        'You do not own this Enrollment. Proof of Impact creation denied.',
        HttpStatus.UNAUTHORIZED
      );
    }
    const status = calculateEnrollmentStatus(enrollment);
    if (status !== EnrollmentStatus.enrolled) {
      throw new HttpException(
        `You are not enrolled in this project.
        Proof of Impact creation denied.
        Current Enrollment Status: ${status}`,
        HttpStatus.BAD_REQUEST
      );
    }
    if (!enrollment.acceptedWaiver) {
      throw new HttpException(
        `You have not accepted the waiver for this Project.
        Please accept the Project's waiver to create a new Proof of Impact.`,
        HttpStatus.BAD_REQUEST
      );
    }

    const myPois = await this.poiRepo.findPoisByCm(user.changeMaker.id, {
      id: true,
      dateStarted: true,
      dateApproved: true,
      dateDenied: true,
      dateSubmitted: true,
      dateStopped: true,
      pausedTimes: true,
      resumedTimes: true,
      enrollment: { project: { title: true } },
    });

    const inProgressPoi = myPois.find((poi) => calculatePoiStatus(poi) < PoiStatus.submitted);
    if (inProgressPoi) {
      throw new HttpException(
        {
          text: `You have an unsubmitted Proof of Impact to the Project Enrollment:
            ${inProgressPoi.enrollment.project.title}. Please submit or withdraw this Proof of Impact
            before creating a new one.`,
          code: 'poiAlreadyExists',
          id: inProgressPoi.id,
        },
        HttpStatus.UNAUTHORIZED
      );
    }

    return this.poiRepo.upsert(
      {
        id: uuid.v4(),
        dateCreated: new Date(),
        answers: [],
        imagesFilePaths: [],
        pausedTimes: [],
        resumedTimes: [],
        enrollment: dto.enrollmentId,
        credits: [],
      },
      query
    );
  }

  async start(query: IQuery<Poi>, token: string, dto: StartPoiTimerDto) {
    const user = await this.auth.validateUserToken(token ?? '', { changeMaker: { id: true } });

    const poiQuery = createQuery<Poi>()({
      enrollment: { changeMaker: { id: true }, project: { creditsEarned: true, requireLocation: true } },
      id: true,
      dateStarted: true,
      dateStopped: true,
      dateSubmitted: true,
      dateApproved: true,
      dateDenied: true,
      pausedTimes: true,
      resumedTimes: true,
    });

    const poi = await this.poiRepo.findOneOrFail(dto.poiId, poiQuery);

    if (user.changeMaker?.id !== poi.enrollment?.changeMaker?.id) {
      throw new HttpException('You do not own this Proof of Impact.', HttpStatus.UNAUTHORIZED);
    }
    const status = calculatePoiStatus(poi);
    if (status !== PoiStatus.created) {
      throw new HttpException(
        'Cannot start a Proof of Impact that has already been started.',
        HttpStatus.CONFLICT
      );
    }
    if (poi.enrollment.project.requireLocation && (!dto.latitude || !dto.longitude)) {
      throw new HttpException('Your location is required for this Proof of Impact.', HttpStatus.BAD_REQUEST);
    }

    await this.dbTransact.run(async () => {
      const taskId = uuid.v4();

      const updatedPoi = await this.poiRepo.update(
        dto.poiId,
        { dateStarted: new Date(), latitude: dto.latitude, longitude: dto.longitude },
        poiQuery
      );
      await this.taskRepo.upsert({ id: taskId, poi: poi.id });

      const mandatoryClockOutDate = calculatePoiMandatoryClockOutDate(updatedPoi);
      const job = new CronJob(mandatoryClockOutDate, () => this.stopNoAuth({ poiId: dto.poiId }));
      this.schedulerRegistry.addCronJob(taskId, job);
      job.start();
    });

    return this.poiRepo.findOneOrFail(dto.poiId, query);
  }

  async stop(query: IQuery<Poi>, token: string, dto: StopPoiTimerDto) {
    const user = await this.auth.validateUserToken(token ?? '', { changeMaker: { id: true } });
    const poi = await this.poiRepo.findOneOrFail(dto.poiId, {
      enrollment: { changeMaker: { id: true }, project: { creditsEarned: true } },
      id: true,
      dateStarted: true,
      dateStopped: true,
      dateSubmitted: true,
      dateApproved: true,
      dateDenied: true,
      pausedTimes: true,
      resumedTimes: true,
      task: { id: true },
    });

    if (user.changeMaker?.id !== poi.enrollment?.changeMaker?.id) {
      throw new HttpException('You do not own this Proof of Impact.', HttpStatus.UNAUTHORIZED);
    }
    const status = calculatePoiStatus(poi);
    if (status !== PoiStatus.started && status !== PoiStatus.paused) {
      throw new HttpException('Proof of Impact must be started or paused to stop.', HttpStatus.CONFLICT);
    }

    await this.stopNoAuth(dto);
    return this.poiRepo.findOneOrFail(dto.poiId, query);
  }

  async stopNoAuth(dto: StopPoiTimerDto) {
    const poi = await this.poiRepo.findOneOrFail(dto.poiId, {
      enrollment: { changeMaker: { id: true }, project: { creditsEarned: true } },
      id: true,
      dateStarted: true,
      dateStopped: true,
      dateSubmitted: true,
      dateApproved: true,
      dateDenied: true,
      pausedTimes: true,
      resumedTimes: true,
      task: { id: true },
    });

    const status = calculatePoiStatus(poi);
    if (status !== PoiStatus.started && status !== PoiStatus.paused) {
      throw new HttpException('Proof of Impact must be started or paused to stop.', HttpStatus.CONFLICT);
    }

    await this.dbTransact.run(async () => {
      await this.poiRepo.update(dto.poiId, {
        dateStopped: new Date(),
        resumedTimes:
          poi.pausedTimes.length > poi.resumedTimes.length
            ? [...poi.resumedTimes, new Date()]
            : poi.resumedTimes,
      });
      const taskId = poi.task?.id;
      if (taskId) {
        await this.taskRepo.delete(taskId);
        try {
          this.schedulerRegistry.deleteCronJob(taskId);
        } catch (e) {
          //
        }
      }
    });
  }

  async withdraw(query: IQuery<{ deletedId: string }>, token: string, dto: EndPoiTimerDto) {
    const user = await this.auth.validateUserToken(token ?? '', { changeMaker: { id: true } });
    const poi = await this.poiRepo.findOneOrFail(dto.poiId, {
      enrollment: { changeMaker: { id: true } },
      dateStarted: true,
      dateStopped: true,
      dateSubmitted: true,
      dateApproved: true,
      dateDenied: true,
      pausedTimes: true,
      resumedTimes: true,
      task: { id: true },
      imagesFilePaths: true,
    });

    if (user.changeMaker?.id !== poi.enrollment?.changeMaker?.id) {
      throw new HttpException('You do not own this Proof of Impact.', HttpStatus.UNAUTHORIZED);
    }
    const status = calculatePoiStatus(poi);
    if (status === PoiStatus.approved) {
      throw new HttpException(
        'This Proof of Impact has already been approved. Withdrawal denied.',
        HttpStatus.CONFLICT
      );
    } else if (status === PoiStatus.denied) {
      throw new HttpException(
        'This Proof of Impact has already been denied. Withdrawal denied.',
        HttpStatus.CONFLICT
      );
    }

    await this.dbTransact.run(async () => {
      if (poi.task?.id) {
        await this.taskRepo.delete(poi.task.id);
      }
      Promise.all(poi.imagesFilePaths.map((path) => this.storage.deleteFile(path)));
      await this.poiRepo.delete(dto.poiId);
    });

    return parseQuery(query, { deletedId: dto.poiId });
  }

  async pause(query: IQuery<Poi>, token: string, dto: PausePoiTimerDto) {
    const user = await this.auth.validateUserToken(token ?? '', { changeMaker: { id: true } });
    const poi = await this.poiRepo.findOneOrFail(dto.poiId, {
      enrollment: { changeMaker: { id: true } },
      dateStarted: true,
      dateStopped: true,
      dateSubmitted: true,
      dateApproved: true,
      dateDenied: true,
      pausedTimes: true,
      resumedTimes: true,
      task: { id: true },
    });

    if (user.changeMaker?.id !== poi.enrollment?.changeMaker?.id) {
      throw new HttpException('You do not own this Proof of Impact.', HttpStatus.UNAUTHORIZED);
    }
    const status = calculatePoiStatus(poi);
    if (status !== PoiStatus.started) {
      throw new HttpException(
        'This Proof of Impact is not in a valid state to be paused.',
        HttpStatus.CONFLICT
      );
    }

    await this.dbTransact.run(async () => {
      await this.poiRepo.update(dto.poiId, { pausedTimes: [...poi.pausedTimes, new Date()] });

      if (poi.task?.id) {
        const task = this.schedulerRegistry.getCronJob(poi.task.id);
        task.stop();
      }
    });

    return this.poiRepo.findOneOrFail(dto.poiId, query);
  }

  async resume(query: IQuery<Poi>, token: string, dto: ResumePoiTimerDto) {
    const user = await this.auth.validateUserToken(token ?? '', { changeMaker: { id: true } });

    const poiQuery = createQuery<Poi>()({
      enrollment: { changeMaker: { id: true }, project: { creditsEarned: true } },
      dateStarted: true,
      dateStopped: true,
      dateSubmitted: true,
      dateApproved: true,
      dateDenied: true,
      pausedTimes: true,
      resumedTimes: true,
      task: { id: true },
    });

    const poi = await this.poiRepo.findOneOrFail(dto.poiId, poiQuery);

    if (user.changeMaker?.id !== poi.enrollment?.changeMaker?.id) {
      throw new HttpException('You do not own this Proof of Impact.', HttpStatus.UNAUTHORIZED);
    }
    if (calculatePoiStatus(poi) !== PoiStatus.paused) {
      throw new HttpException(
        'This Proof of Impact is not in a valid state to be resumed.',
        HttpStatus.CONFLICT
      );
    }

    await this.dbTransact.run(async () => {
      const updatedPoi = await this.poiRepo.update(
        dto.poiId,
        { resumedTimes: [...poi.resumedTimes, new Date()] },
        poiQuery
      );
      const mandatoryClockOutDate = calculatePoiMandatoryClockOutDate(updatedPoi);
      if (updatedPoi.task?.id) {
        const job = this.schedulerRegistry.getCronJob(updatedPoi.task.id);
        job.setTime(new CronTime(mandatoryClockOutDate));
        job.start();
      }
    });

    return this.poiRepo.findOneOrFail(dto.poiId, query);
  }

  async submit(query: IQuery<Poi>, token: string, dto: SubmitPoiDto, files: Express.Multer.File[]) {
    const user = await this.auth.validateUserToken(token ?? '', { changeMaker: { id: true } });
    const poi = await this.poiRepo.findOneOrFail(dto.poiId, {
      enrollment: {
        changeMaker: { id: true, handle: { id: true } },
        project: {
          title: true,
          requireImages: true,
          questions: {},
          servePartner: { name: true, admins: { user: { id: true } } },
        },
      },
      dateStarted: true,
      dateStopped: true,
      dateSubmitted: true,
      dateApproved: true,
      dateDenied: true,
      pausedTimes: true,
      resumedTimes: true,
      task: { id: true },
    });

    if (user.changeMaker?.id !== poi.enrollment?.changeMaker?.id) {
      throw new HttpException('You do not own this Proof of Impact.', HttpStatus.UNAUTHORIZED);
    }
    const status = calculatePoiStatus(poi);
    if (status !== PoiStatus.started && status !== PoiStatus.paused && status !== PoiStatus.stopped) {
      throw new HttpException(
        'This Proof of Impact is not in a valid state to be submitted.',
        HttpStatus.BAD_REQUEST
      );
    }
    if (poi.enrollment.project.requireImages && files.length < 1) {
      throw new HttpException(
        'This Proof of Impact requires at least one image upon submission.',
        HttpStatus.BAD_REQUEST
      );
    }
    if (poi.enrollment.project.questions.length !== dto.answers.length) {
      throw new HttpException(
        `This Proof of Impact requires the submission of answers to ${poi.enrollment.project.questions.length} questions.`,
        HttpStatus.BAD_REQUEST
      );
    }

    const MIN_WIDTH = 1080;
    const MIN_HEIGHT = 1080;
    const validateImageSize = async (file : Express.Multer.File) => {
      const image = sharp(file.buffer);

      const { width, height } = await image.metadata();

      if (!width || !height) {
        throw new HttpException(
          `The uploaded images are in in an invalid state`,
          HttpStatus.BAD_REQUEST
        );
      }

      if (width < MIN_WIDTH || height < MIN_HEIGHT) {
        throw new HttpException(
          `Uploaded Proof of Impact photos must be at least ${MIN_WIDTH}x${MIN_HEIGHT} large.`,
          HttpStatus.BAD_REQUEST
        );
      }
    }
    for (const file of files) await validateImageSize(file);

    await this.dbTransact.run(async () => {
      const imagesFilePaths: string[] = [];
      for (const file of files) {
        const ext = this.storage.extractFileExtension(file.originalname);
        const name = `${uuid.v4()}.${ext}`;
        const path = generatePoiImageFilePath({
          root: ImStorageFileRoots.poi,
          poiId: dto.poiId,
          filename: name,
        });
        imagesFilePaths.push(path);
        await this.storage.upload(path, file);
      }

      await this.qaRepo.upsertMany(
        dto.answers.map((a) => ({
          id: uuid.v4(),
          answer: a.answer,
          dateAnswered: new Date(),
          poi: dto.poiId,
          question: a.questionId,
        }))
      );

      await this.poiRepo.update(
        dto.poiId,
        {
          dateSubmitted: new Date(),
          dateStopped: poi.dateStopped ?? new Date(),
          resumedTimes:
            poi.pausedTimes.length > poi.resumedTimes.length
              ? [...poi.resumedTimes, new Date()]
              : poi.resumedTimes,
          imagesFilePaths,
        },
        query
      );

      if (poi.task?.id) {
        await this.taskRepo.delete(poi.task.id);
        try {
          this.schedulerRegistry.deleteCronJob(poi.task.id);
        } catch (e) {
          console.error(e);
        }
      }
    });

    await this.email.sendInfoEmail({
      message: `@${poi.enrollment.changeMaker.handle.id} has submitted a Proof of Impact
                for your Project ${poi.enrollment.project.title}.`,
      subject: `New Proof of Impact has been Submitted`,
      user: poi.enrollment.project.servePartner.name,
      email: poi.enrollment.project.servePartner.admins.map((a) => a.user.id),
    });

    return this.poiRepo.findOneOrFail(dto.poiId, query);
  }

  async approve(query: IQuery<Poi>, token: string, dto: ApprovePoiDto) {
    const poi = await this.poiRepo.findOneOrFail(dto.poiId, {
      enrollment: { project: { servePartner: { id: true } }, changeMaker: { id: true } },
      id: true,
      dateStarted: true,
      dateStopped: true,
      dateSubmitted: true,
      dateApproved: true,
      dateDenied: true,
      pausedTimes: true,
      resumedTimes: true,
    });

    const user = await this.posService.permissions.userIsServeAdmin(
      token,
      poi.enrollment.project.servePartner.id
    );

    if (user.changeMaker?.id === poi.enrollment.changeMaker.id) {
      throw new HttpException('You cannot approve your own Proof of Impact.', HttpStatus.UNAUTHORIZED);
    }

    const status = calculatePoiStatus(poi);
    if (status !== PoiStatus.submitted) {
      throw new HttpException(
        'This Proof of Impact must first be submitted to be approved.',
        HttpStatus.BAD_REQUEST
      );
    }

    await this.dbTransact.run(async () => {
      await this.poiRepo.update(dto.poiId, { dateApproved: new Date() });
      await this.creditRepo.upsert({
        id: uuid.v4(),
        amount: calculateCreditsEarnedForPoi(poi),
        dateMinted: new Date(),
        escrow: false,
        poi: poi.id,
        changeMaker: poi.enrollment.changeMaker.id,
      });
    });
    return this.poiRepo.findOneOrFail(dto.poiId, query);
  }

  async deny(query: IQuery<Poi>, token: string, dto: DenyPoiDto) {
    const poi = await this.poiRepo.findOneOrFail(dto.poiId, {
      enrollment: { project: { servePartner: { id: true } }, changeMaker: { id: true } },
      dateStarted: true,
      dateStopped: true,
      dateSubmitted: true,
      dateApproved: true,
      dateDenied: true,
      pausedTimes: true,
      resumedTimes: true,
    });

    const user = await this.posService.permissions.userIsServeAdmin(
      token,
      poi.enrollment.project.servePartner.id
    );

    if (user.changeMaker?.id === poi.enrollment.changeMaker.id) {
      throw new HttpException('You cannot deny your own Proof of Impact.', HttpStatus.UNAUTHORIZED);
    }

    const status = calculatePoiStatus(poi);
    if (status !== PoiStatus.submitted) {
      throw new HttpException(
        'This Proof of Impact must first be submitted to be denied.',
        HttpStatus.BAD_REQUEST
      );
    }

    return this.poiRepo.update(dto.poiId, { dateDenied: new Date() }, query);
  }
}
