type EnvironmentMode = 'development' | 'test' | 'production';

type EnvValue = string | undefined;

type FirebaseConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

type FeatureFlags = {
  enableDevPanel: boolean;
  enableDiagnosticsOverlay: boolean;
  enableTelemetry: boolean;
};

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LoggingConfig = {
  level: LogLevel;
};

type EnvironmentConfig = {
  mode: EnvironmentMode;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  appVersion: string;
  firebase: FirebaseConfig;
  flags: FeatureFlags;
  logging: LoggingConfig;
};

const mode = (import.meta.env.MODE as EnvironmentMode | undefined) ?? 'development';

const readEnv = (key: string): EnvValue => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  if (!value) {
    return undefined;
  }
  return value;
};

const normalizeBooleanFlag = (value: EnvValue, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }
  const normalized = value.toLowerCase();
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) {
    return false;
  }
  return fallback;
};

const parseLogLevel = (value: EnvValue): LogLevel => {
  if (value) {
    const normalized = value.toLowerCase();
    if (normalized === 'debug' || normalized === 'info' || normalized === 'warn' || normalized === 'error') {
      return normalized;
    }
  }
  return mode === 'production' ? 'warn' : 'debug';
};

const firebaseConfig: FirebaseConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('VITE_FIREBASE_APP_ID'),
  measurementId: readEnv('VITE_FIREBASE_MEASUREMENT_ID')
};

const flags: FeatureFlags = {
  enableDevPanel: normalizeBooleanFlag(readEnv('VITE_ENABLE_DEV_PANEL'), mode !== 'production'),
  enableDiagnosticsOverlay: normalizeBooleanFlag(readEnv('VITE_ENABLE_DIAGNOSTICS_OVERLAY'), mode !== 'production'),
  enableTelemetry: normalizeBooleanFlag(readEnv('VITE_ENABLE_TELEMETRY'), mode === 'production')
};

const logging: LoggingConfig = {
  level: parseLogLevel(readEnv('VITE_LOG_LEVEL'))
};

export const environment: EnvironmentConfig = {
  mode,
  isDevelopment: mode === 'development',
  isProduction: mode === 'production',
  isTest: mode === 'test',
  appVersion: readEnv('VITE_APP_VERSION') ?? '0.0.0',
  firebase: firebaseConfig,
  flags,
  logging
};

export const shouldInitialiseFirebase = Object.values(environment.firebase).some(Boolean);

export type { EnvironmentConfig, FirebaseConfig, FeatureFlags, LogLevel, LoggingConfig };
