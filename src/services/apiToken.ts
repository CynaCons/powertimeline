/**
 * API Token Service (Client-side)
 * Wrappers for the Cloud Function callables that manage API tokens.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { app, db } from '../lib/firebase';

const functions = getFunctions(app);

export interface ApiTokenStatus {
  exists: boolean;
  createdAt?: string;
  lastUsedAt?: string;
  label?: string;
}

/**
 * Get the current API token status for a user.
 * Reads from users/{userId}/settings/api.
 */
export async function getApiTokenStatus(userId: string): Promise<ApiTokenStatus> {
  const settingsRef = doc(db, 'users', userId, 'settings', 'api');
  const settingsDoc = await getDoc(settingsRef);

  if (!settingsDoc.exists()) {
    return { exists: false };
  }

  const data = settingsDoc.data();
  return {
    exists: true,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt,
    lastUsedAt: data.lastUsedAt?.toDate?.()?.toISOString?.() ?? data.lastUsedAt ?? undefined,
    label: data.label,
  };
}

/**
 * Generate a new API token. Returns the raw token (shown once).
 * If a token already exists, it will be revoked first.
 */
export async function generateApiToken(label?: string): Promise<string> {
  const callable = httpsCallable<{ label?: string }, { token: string }>(
    functions,
    'generateApiToken'
  );
  const result = await callable({ label });
  return result.data.token;
}

/**
 * Revoke the current API token.
 */
export async function revokeApiToken(): Promise<void> {
  const callable = httpsCallable<void, { success: boolean }>(
    functions,
    'revokeApiToken'
  );
  await callable();
}
