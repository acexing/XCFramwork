import { Component } from 'cc';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { EventHandler, IEventBus } from '../../core/interfaces/IEventBus';
import { IUIManager } from '../../core/interfaces/IUIManager';
import { ServiceRegistry } from '../../app/ServiceRegistry';

export abstract class BaseView extends Component {
  public viewId = '';
  public viewData: unknown = null;

  protected get eventBus(): IEventBus {
    return ServiceRegistry.get<IEventBus>(SERVICE_TOKENS.EVENT_BUS);
  }

  public setupView(viewId: string, data: unknown): void {
    this.viewId = viewId;
    this.viewData = data;
  }

  public onOpen(_data?: unknown): void | Promise<void> {}

  public onShow(): void {}

  public onHide(): void {}

  public onClose(): void {}

  protected bindEvent<T>(event: string, handler: EventHandler<T>): void {
    this.eventBus.on(event, handler as EventHandler, this);
  }

  protected unbindEvent<T>(event: string, handler: EventHandler<T>): void {
    this.eventBus.off(event, handler as EventHandler, this);
  }

  protected closeSelf(): void {
    ServiceRegistry.get<IUIManager>(SERVICE_TOKENS.UI_MANAGER).close(this.viewId);
  }

  protected onDestroy(): void {
    this.eventBus.offByTarget(this);
  }
}
