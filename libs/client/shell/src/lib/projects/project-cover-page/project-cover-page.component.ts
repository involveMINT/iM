import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Navigation } from '@angular/router';
import { ClientCmApiService, EnrollmentStoreModel } from '@involvemint/client/cm/api';
import {
  ImViewProfileModalService,
  ProjectFeedStoreModel,
  UserFacade,
} from '@involvemint/client/shared/data-access';
import { RouteService } from '@involvemint/client/shared/routes';
import { StatefulComponent, StatusService } from '@involvemint/client/shared/util';
import {
  calculateEnrolledEnrollments,
  calculateEnrollmentStatus,
  calculateProjectStatus,
  EnrollmentStatus,
  formatImAddress,
  ProjectStatus,
} from '@involvemint/shared/domain';
import { combineLatest, EMPTY } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

type ButtonState = EnrollmentStatus | 'notApplied' | 'loading' | 'createCmProfile';

interface State {
  project?: ProjectFeedStoreModel;
  enrollment?: EnrollmentStoreModel;
  authenticated: boolean;
  projectState?: ProjectStatus;
  buttonState: ButtonState;
}

@Component({
  selector: 'involvemint-cm-feature-projects-project-cover',
  templateUrl: './project-cover-page.component.html',
  styleUrls: ['./project-cover-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCoverPageComponent extends StatefulComponent<State> implements OnInit {
  from : any = "Projects";
  get EnrollmentStatus() {
    return EnrollmentStatus;
  }

  get ProjectStatus() {
    return ProjectStatus;
  }
  
  get previousPage() {
    const currNav = this.router.getCurrentNavigation()
    if (currNav) {
      let prevPage = currNav.previousNavigation?.finalUrl?.root.children.primary.segments[0].path;
      this.from = prevPage == "activityfeed" ? "Activity" : "Projects";
    }
    return this.from;
  }

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly user: UserFacade,
    public readonly route: RouteService,
    private readonly cmApi: ClientCmApiService,
    private readonly status: StatusService,
    private readonly viewProfileModal: ImViewProfileModalService,
    private readonly router: Router,
  ) {
    super({ authenticated: false, buttonState: 'loading' });
  }

  ngOnInit(): void {
    // If there is no project id in params then get out.
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (!id) {
      this.back();
      return;
    }

    this.effect(() =>
      combineLatest([this.user.projects.selectors.getProject(id), this.user.session.selectors.state$]).pipe(
        switchMap(([{ project }, { changeMaker, id }]) => {
          this.updateState({
            project,
            authenticated: !!id,
            projectState: project ? calculateProjectStatus(project) : undefined,
          });

          if (!project) {
            return EMPTY;
          }

          if (!changeMaker) {
            this.updateState({ buttonState: 'createCmProfile' });
            return EMPTY;
          }

          return this.cmApi.enrollments$.pipe(
            tap(({ enrollments, loaded }) => {
              if (!loaded) return;
              const projectEnrollments = enrollments.filter((e) => e.project.id === project.id);
              // to support multiple enrollments, if there is started enrollment, use that, if there is a pending,
              // use that, if there is a enrolled, use that, if there is a denied, use that, and finally, if
              // there is a retired, use that. Always check in this direction.
              const linkedEnrollment =
                projectEnrollments.find((e) => calculateEnrollmentStatus(e) === EnrollmentStatus.started) ||
                projectEnrollments.find((e) => calculateEnrollmentStatus(e) === EnrollmentStatus.pending) ||
                projectEnrollments.find((e) => calculateEnrollmentStatus(e) === EnrollmentStatus.enrolled) ||
                projectEnrollments.find((e) => calculateEnrollmentStatus(e) === EnrollmentStatus.denied) ||
                projectEnrollments.find((e) => calculateEnrollmentStatus(e) === EnrollmentStatus.retired);
              this.updateState({
                enrollment: linkedEnrollment,
                buttonState: linkedEnrollment ? calculateEnrollmentStatus(linkedEnrollment) : 'notApplied',
              });
            })
          );
        })
      )
    );
  }

  back() {
    return this.route.back(() => this.route.to.projects.ROOT({ animation: 'back' }));
  }

  viewServePartnerInfo(project: ProjectFeedStoreModel) {
    this.viewProfileModal.open({ handle: project.servePartner.handle.id });
  }

  startApplication(project: ProjectFeedStoreModel) {
    if (calculateProjectStatus(project) === ProjectStatus.closed) {
      this.status.presentAlert({ title: 'Error', description: 'Project closed' });
    }
    this.cmApi.startApplication(project);
  }

  viewEnrollment(enrollment: EnrollmentStoreModel) {
    this.user.session.selectors.state$.pipe(take(1)).subscribe(({ changeMaker }) => {
      this.route.to.cm.enrollments.ENROLLMENT(enrollment.id, { queryParams: { profile: changeMaker?.id } });
    });
  }

  createPOI(enrollment: EnrollmentStoreModel) {
    this.cmApi.newPoi(enrollment);
  }

  login() {
    this.route.to.login.ROOT();
  }  

  createCmProfile() {
    this.route.to.applications.cm.ROOT();
  }

  gotoGoogleMapsLink(address: ProjectFeedStoreModel['address']) {
    window.open(`http://maps.google.com/?q=${formatImAddress(address)}`, '_blank');
  }

  calculateEnrolledEnrollments(project: ProjectFeedStoreModel) {
    return calculateEnrolledEnrollments(project, EnrollmentStatus.enrolled);
  }
}
