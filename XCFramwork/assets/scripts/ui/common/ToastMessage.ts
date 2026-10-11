import { _decorator, Label } from 'cc';
import { BaseView } from './BaseView';

const { ccclass, property } = _decorator;

export interface ToastData {
  text: string;
  duration: number;
}

const DEFAULT_DURATION_MS = 2000;

@ccclass('ToastMessage')
export class ToastMessage extends BaseView {
  @property(Label)
  messageLabel: Label | null = null;

  private duration = DEFAULT_DURATION_MS;

  public onOpen(data?: unknown): void {
    const toastData = (data as ToastData) ?? null;
    this.duration = toastData?.duration ?? DEFAULT_DURATION_MS;
    if (this.messageLabel) {
      this.messageLabel.string = toastData?.text ?? '';
    }
    this.scheduleOnce(() => this.closeSelf(), this.duration / 1000);
  }
}
