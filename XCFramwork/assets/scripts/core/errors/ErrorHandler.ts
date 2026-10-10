import { DEBUG } from 'cc/env';
import {
  ErrorHandlerFn,
  GlobalErrorHandlerFn,
  IErrorHandler,
  ErrorContext,
} from '../interfaces/IErrorHandler';
import { ILogger } from '../interfaces/ILogger';

const LOGGER_TAG = 'ErrorHandler';

export class ErrorHandler implements IErrorHandler {
  private logger: ILogger;
  private handlers: ErrorHandlerFn[] = [];
  private globalHandler: GlobalErrorHandlerFn | null = null;
  private captureRegistered = false;
  private onWindowError = this.onUnhandledError.bind(this);
  private onUnhandledRejection = this.onRejection.bind(this);

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  handle(error: Error, context?: ErrorContext): void {
    this.logError(error, context);
    for (const handler of this.handlers) {
      if (handler(error, context)) {
        return;
      }
    }
    if (this.globalHandler) {
      this.globalHandler(error, context);
      return;
    }
    if (DEBUG) {
      console.error(
        `[ErrorHandler] 未处理错误: ${context ? JSON.stringify(context) : '(无上下文)'}`,
        error
      );
    }
  }

  handlePromiseRejection(reason: unknown, context?: ErrorContext): void {
    if (reason instanceof Error) {
      this.handle(reason, context);
      return;
    }
    this.handle(new Error(String(reason)), context);
  }

  registerHandler(handler: ErrorHandlerFn): void {
    this.handlers.push(handler);
  }

  setGlobalHandler(handler: GlobalErrorHandlerFn): void {
    this.globalHandler = handler;
  }

  registerGlobalCapture(): void {
    if (this.captureRegistered) {
      return;
    }
    this.captureRegistered = true;
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.onWindowError);
      window.addEventListener('unhandledrejection', this.onUnhandledRejection);
    }
  }

  private onUnhandledError(event: ErrorEvent): void {
    if (event.error instanceof Error) {
      this.handle(event.error, { module: 'global', operation: 'window.onerror', version: '' });
    }
  }

  private onRejection(event: PromiseRejectionEvent): void {
    this.handlePromiseRejection(event.reason, {
      module: 'global',
      operation: 'unhandledrejection',
      version: '',
    });
  }

  private logError(error: Error, context?: ErrorContext): void {
    if (context) {
      this.logger.error(
        LOGGER_TAG,
        `模块=${context.module} 操作=${context.operation} 版本=${context.version}`,
        error
      );
    } else {
      this.logger.error(LOGGER_TAG, '未提供上下文', error);
    }
  }
}
