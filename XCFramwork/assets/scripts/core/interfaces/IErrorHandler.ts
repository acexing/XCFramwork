export interface ErrorContext {
  module: string;
  operation: string;
  version: string;
  extra?: Record<string, unknown>;
}

export type ErrorHandlerFn = (error: Error, context?: ErrorContext) => boolean;
export type GlobalErrorHandlerFn = (error: Error, context?: ErrorContext) => void;

export interface IErrorHandler {
  handle(error: Error, context?: ErrorContext): void;
  handlePromiseRejection(reason: unknown, context?: ErrorContext): void;
  registerHandler(handler: ErrorHandlerFn): void;
  setGlobalHandler(handler: GlobalErrorHandlerFn): void;
  registerGlobalCapture(): void;
}
