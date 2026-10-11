import { _decorator, Label } from 'cc';
import { BaseView } from './BaseView';

const { ccclass, property } = _decorator;

export interface LoadingMaskData {
  text: string;
}

@ccclass('LoadingMask')
export class LoadingMask extends BaseView {
  @property(Label)
  textLabel: Label | null = null;

  public onOpen(data?: unknown): void {
    const maskData = (data as LoadingMaskData) ?? null;
    this.applyText(maskData?.text ?? '');
  }

  protected onLoad(): void {
    this.node.on('update-loading-text', this.onUpdateText, this);
  }

  protected onDestroy(): void {
    this.node.off('update-loading-text', this.onUpdateText, this);
    super.onDestroy();
  }

  private onUpdateText(text: unknown): void {
    this.applyText(typeof text === 'string' ? text : '');
  }

  private applyText(text: string): void {
    if (this.textLabel) {
      this.textLabel.string = text;
    }
  }
}
