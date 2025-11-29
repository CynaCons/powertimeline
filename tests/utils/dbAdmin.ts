import fs from 'fs';
import path from 'path';
import { getApps, initializeApp, cert, type AppOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

type EnvTarget = 'dev' | 'prod';

const SERVICE_ACCOUNT_PATHS: Record<EnvTarget, string[]> = {
  dev: [
    process.env.FIREBASE_ADMIN_CREDENTIALS_PATH || '',
    path.resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json'),
  ],
  prod: [
    process.env.FIREBASE_ADMIN_CREDENTIALS_PATH || '',
    path.resolve(process.cwd(), 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json'),
  ],
};

export function initFirestore(target: EnvTarget = 'dev') {
  if (getApps().length > 0) {
    return getFirestore();
  }

  const candidatePaths = SERVICE_ACCOUNT_PATHS[target].filter(Boolean);
  let credentialJson: Record<string, unknown> | null = null;

  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) {
      credentialJson = JSON.parse(fs.readFileSync(p, 'utf8'));
      break;
    }
  }

  if (!credentialJson) {
    throw new Error(`No service account JSON found for target ${target}. Set FIREBASE_ADMIN_CREDENTIALS_PATH or place key in repo root.`);
  }

  const options: AppOptions = { credential: cert(credentialJson as Record<string, string>) };
  initializeApp(options);
  return getFirestore();
}
