import { Injectable } from '@angular/core';
import { convertDeepReadonly, DeepReadonly } from '@involvemint/shared/util';
import { AlertController, LoadingController } from '@ionic/angular';
import { TypedAction } from '@ngrx/store/src/models';
import * as uuid from 'uuid';

export interface AlertData {
  title: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class StatusService {
  private loaderCount = 0;

  constructor(public loadingController: LoadingController, private alertController: AlertController) {}

  async showLoader(message = 'Loading...'): Promise<void> {
    this.loaderCount++;
    if (this.loaderCount === 1) {
      let topLoader = await this.loadingController.getTop();
      if (topLoader) return;
      topLoader = await this.loadingController.create({ message, spinner: 'crescent' });
      await topLoader.present();
    }
  }

  async changeLoaderMessage(message: string): Promise<void> {
    const topLoader = await this.loadingController.getTop();
    if (topLoader) topLoader.message = message;
    else console.warn('No top loader found.');
  }

  async dismissLoader() {
    this.loaderCount--;
    if (this.loaderCount < 0) {
      console.warn('Loading dismiss mismatch!');
      this.loaderCount = 0;
    }
    if (this.loaderCount > 0) return;
    let topLoader = await this.loadingController.getTop();
    while (topLoader) {
      if (!(await topLoader.dismiss())) return;
      topLoader = await this.loadingController.getTop();
    }
  }

  /**
   * Provisions an Ionic loading screen while an async `task` is being fulfilled.
   * You can specify callbacks for each possible case of a result: success, error, complete.
   * @param task Function to wait on while loading screen is shown
   * @param success This will be called if successful with result as argument
   * @param error This will be called if an error occurs with error result as argument
   * @param complete This will be called every time after `success` or `error`
   * @param message Message to show on loading screen (defaults to `Loading ...`)
   */
  async provisionLoadTask<SuccessType>({
    task,
    success,
    error,
    complete,
    message = 'Loading ...',
  }: {
    task: () => Promise<SuccessType>;
    success?: (res: DeepReadonly<SuccessType>) => Promise<unknown>;
    error?: (err: unknown) => Promise<unknown>;
    complete?: () => Promise<unknown>;
    message?: string;
  }): Promise<void> {
    const id = uuid.v4();
    const loading = await this.loadingController.create({ message, id });
    await loading.present();

    let res = {} as SuccessType;
    let err = {};

    let isSuccessful: boolean;

    try {
      res = await task();
      isSuccessful = true;
    } catch (e) {
      err = e;
      isSuccessful = false;
    }

    if (success && isSuccessful) {
      await success(convertDeepReadonly(res));
    } else if (error) {
      await error(err);
    }

    if (complete) {
      await complete();
    }

    await this.loadingController.dismiss(undefined, undefined, id);
  }

  /**
   * Presents a window with a checkmark indicating something successful has occurred.
   */
  async presentSuccess(message = 'Success!'): Promise<void> {
    const loading = await this.loadingController.create({
      message,
      duration: 2000,
      spinner: null,
    });
    return loading.present();
  }

  /**
   * Presents a window with a information regarding something important the user should know.
   * @param alertData
   */
  async presentAlert(alertData: DeepReadonly<AlertData>): Promise<void> {
    const alert = await this.alertController.create({
      header: alertData.title,
      message: alertData.description,
      buttons: ['OK'],
    });
    return alert.present();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async presentNgRxActionAlert(action: TypedAction<string>, error: any): Promise<void> {
    const header = `Error on ${action.type.replace(/\[.*\]\s/g, '')}`;
    const alert = await this.alertController.create({
      header,
      message: error.error?.message || error.message,
      buttons: ['OK'],
    });
    return alert.present();
  }

  /**
   *  Presents a informational window to prompt the user about something (likely a yes or no question).
   * @param alertData Information to prompt the user.
   * @param buttonText Text for the action button.
   * @param actionButtonClicked Callback for when the action button is pressed.
   */
  async presentAlertWithAction({
    alertData,
    buttonText,
    buttonCssClass,
    cancelButtonText,
  }: {
    alertData: DeepReadonly<AlertData>;
    buttonText: string;
    buttonCssClass: 'im-alert-deny' | 'im-alert-confirm';
    cancelButtonText?: string;
  }): Promise<boolean> {
    let action = false;
    const alert = await this.alertController.create({
      header: alertData.title,
      message: alertData.description,
      buttons: [
        cancelButtonText ?? 'Cancel',
        { text: buttonText, handler: () => (action = true), cssClass: buttonCssClass },
      ],
    });
    await alert.present();
    await alert.onDidDismiss();
    return action;
  }
}
