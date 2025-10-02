import { environment } from '../config/environment';
import type { LogLevel } from '../config/environment';

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

type LogContext = Record<string, unknown> | undefined;

type LogEntry = {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: unknown;
  timestamp: number;
};

type LogListener = (entry: LogEntry) => void;

const listeners = new Set<LogListener>();
const shouldEmitToConsole = (level: LogLevel) => levelWeight[level] >= levelWeight[environment.logging.level];

const emitToConsole = (entry: LogEntry) => {
  if (!shouldEmitToConsole(entry.level)) {
    return;
  }

  const payload = entry.context ? [entry.message, entry.context] : [entry.message];

  switch (entry.level) {
    case 'debug':
      console.debug(...payload);
      break;
    case 'info':
      console.info(...payload);
      break;
    case 'warn':
      console.warn(...payload);
      break;
    case 'error':
      if (entry.error instanceof Error) {
        console.error(entry.message, entry.error, entry.context);
      } else {
        console.error(...payload);
      }
      break;
    default:
      console.log(...payload);
      break;
  }
};

const notifyListeners = (entry: LogEntry) => {
  listeners.forEach((listener) => {
    try {
      listener(entry);
    } catch (listenerError) {
      console.warn('Log listener threw an error', { listenerError });
    }
  });
};

const createEntry = (level: LogLevel, message: string, context?: LogContext, error?: unknown): LogEntry => ({
  level,
  message,
  context,
  error,
  timestamp: Date.now()
});

const log = (level: LogLevel, message: string, context?: LogContext, error?: unknown) => {
  const entry = createEntry(level, message, context, error);
  emitToConsole(entry);
  notifyListeners(entry);
};

const formatErrorContext = (error: unknown, context?: LogContext) => {
  if (error instanceof Error) {
    return {
      ...context,
      name: error.name,
      stack: error.stack
    };
  }
  if (error === undefined) {
    return context;
  }
  return {
    ...context,
    error
  };
};

let globalHandlersInstalled = false;

const installGlobalHandlers = () => {
  if (globalHandlersInstalled || typeof window === 'undefined') {
    return;
  }

  const captureErrors = environment.flags.enableTelemetry || environment.isDevelopment;
  if (!captureErrors) {
    return;
  }

  const errorHandler = (event: ErrorEvent) => {
    log('error', event.message ?? 'Unhandled error', formatErrorContext(event.error ?? event, {
      source: 'window.onerror',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }), event.error ?? event.message);
  };

  const rejectionHandler = (event: PromiseRejectionEvent) => {
    log('error', 'Unhandled promise rejection', formatErrorContext(event.reason, {
      source: 'unhandledrejection'
    }), event.reason);
  };

  window.addEventListener('error', errorHandler);
  window.addEventListener('unhandledrejection', rejectionHandler);
  globalHandlersInstalled = true;
};

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, error?: unknown, context?: LogContext) => log('error', message, formatErrorContext(error, context), error),
  captureError: (error: unknown, context?: LogContext) => {
    if (error instanceof Error) {
      log('error', error.message, formatErrorContext(error, context), error);
    } else {
      log('error', 'Unknown error', formatErrorContext(error, context), error);
    }
  },
  addListener: (listener: LogListener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  removeListener: (listener: LogListener) => listeners.delete(listener),
  initialize: installGlobalHandlers
};

export type { LogEntry, LogListener };
