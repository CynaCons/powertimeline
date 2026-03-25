/**
 * API Token Service
 * Handles generation, validation, and revocation of API tokens
 * for the Timeline Automation API.
 *
 * Tokens are SHA-256 hashed before storage — the raw token is only
 * returned once at generation time and never stored.
 */

import * as crypto from "crypto";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";

// Lazy-initialized — admin.initializeApp() must be called first (in index.ts)
function getDb() {
  return admin.firestore();
}

const TOKEN_PREFIX = "pt_";
const TOKEN_BYTES = 32; // 256-bit entropy

// ============================================================================
// Token Generation & Revocation
// ============================================================================

/**
 * Hash a raw token with SHA-256 for storage/lookup.
 * Using the hash as the Firestore document ID enables O(1) lookup.
 */
export function hashToken(rawToken: string): string {
  // Strip the prefix before hashing
  const tokenBody = rawToken.startsWith(TOKEN_PREFIX)
    ? rawToken.slice(TOKEN_PREFIX.length)
    : rawToken;
  return crypto.createHash("sha256").update(tokenBody).digest("hex");
}

/**
 * Generate a new API token for a user.
 * If the user already has a token, it is revoked first (one-per-user constraint).
 * Returns the raw token — this is the only time it's available in plaintext.
 */
export async function generateToken(
  userId: string,
  label: string
): Promise<string> {
  // Generate cryptographically secure random token
  const tokenBody = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const rawToken = `${TOKEN_PREFIX}${tokenBody}`;
  const tokenHash = hashToken(rawToken);

  // Revoke any existing token for this user
  await revokeToken(userId);

  const now = admin.firestore.FieldValue.serverTimestamp();

  // Store hashed token (document ID = hash for O(1) lookup)
  await getDb().doc(`api_tokens/${tokenHash}`).set({
    userId,
    label,
    createdAt: now,
    lastUsedAt: null,
  });

  // Store user→token reference for revocation lookup
  await getDb().doc(`users/${userId}/settings/api`).set({
    tokenHash,
    createdAt: now,
    label,
  });

  logger.info(`API token generated for user ${userId}`);
  return rawToken;
}

/**
 * Revoke a user's API token.
 * Deletes both the api_tokens document and the user's settings reference.
 */
export async function revokeToken(userId: string): Promise<boolean> {
  const settingsRef = getDb().doc(`users/${userId}/settings/api`);
  const settingsDoc = await settingsRef.get();

  if (!settingsDoc.exists) {
    return false; // No token to revoke
  }

  const { tokenHash } = settingsDoc.data() as { tokenHash: string };

  // Delete both documents
  const batch = getDb().batch();
  batch.delete(getDb().doc(`api_tokens/${tokenHash}`));
  batch.delete(settingsRef);
  await batch.commit();

  logger.info(`API token revoked for user ${userId}`);
  return true;
}

// ============================================================================
// Token Validation
// ============================================================================

/**
 * Validate format of a raw token.
 * Must be: pt_ followed by exactly 64 hex characters.
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token.startsWith(TOKEN_PREFIX)) return false;
  const body = token.slice(TOKEN_PREFIX.length);
  return /^[0-9a-f]{64}$/.test(body);
}

/**
 * Validate a raw token and return the associated userId, or null if invalid.
 * Also debounces lastUsedAt updates (only writes if >5 minutes stale).
 */
export async function validateToken(
  rawToken: string
): Promise<{ userId: string } | null> {
  if (!isValidTokenFormat(rawToken)) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const tokenDoc = await getDb().doc(`api_tokens/${tokenHash}`).get();

  if (!tokenDoc.exists) {
    return null;
  }

  const data = tokenDoc.data()!;
  const userId = data.userId as string;

  // Debounced lastUsedAt update — only if older than 5 minutes
  const lastUsed = data.lastUsedAt?.toDate?.() as Date | undefined;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  if (!lastUsed || lastUsed < fiveMinutesAgo) {
    // Fire-and-forget — don't block the request
    getDb().doc(`api_tokens/${tokenHash}`)
      .update({ lastUsedAt: admin.firestore.FieldValue.serverTimestamp() })
      .catch((err) => logger.warn("Failed to update lastUsedAt:", err));
  }

  return { userId };
}

// ============================================================================
// Rate Limiting (in-memory sliding window)
// ============================================================================

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // requests per window

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Check if a token hash is within rate limits.
 * Uses an in-memory sliding window — per Cloud Function instance.
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(tokenHash: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  let entry = rateLimitMap.get(tokenHash);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitMap.set(tokenHash, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= RATE_LIMIT_MAX) {
    return false; // Rate limited
  }

  entry.timestamps.push(now);
  return true;
}
