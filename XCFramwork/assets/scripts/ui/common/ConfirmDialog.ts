import { _decorator, Button, Label } from 'cc';
import { BaseView } from './BaseView';

const { ccclass, property } = _decorator;

export interface ConfirmDialogData {
  title?: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@ccclass('ConfirmDialog')
export class ConfirmDialog extends BaseView {
  @property(Label)
  titleLabel: Label | null = null;

  @property(Label)
  contentLabel: Label | null = null;

  @property(Button)
  confirmButton: Button | null = null;

  @property(Button)
  cancelButton: Button | null = null;

  private dialogData: ConfirmDialogData | null = null;

  public onOpen(data?: unknown): void {
    this.dialogData = (data as ConfirmDialogData) ?? null;
    if (this.titleLabel) {
      this.titleLabel.string = this.dialogData?.title ?? '';
    }
    if (this.contentLabel) {
      this.contentLabel.string = this.dialogData?.content ?? '';
    }
    this.confirmButton?.node.on(Button.EventType.CLICK, this.onConfirmClick, this);
    this.cancelButton?.node.on(Button.EventType.CLICK, this.onCancelClick, this);
  }

  public onClose(): void {
    this.confirmButton?.node.off(Button.EventType.CLICK, this.onConfirmClick, this);
    this.cancelButton?.node.off(Button.EventType.CLICK, this.onCancelClick, this);
  }

  private onConfirmClick(): void {
    this.dialogData?.onConfirm?.();
    this.closeSelf();
  }

  private onCancelClick(): void {
    this.dialogData?.onCancel?.();
    this.closeSelf();
  }
}
