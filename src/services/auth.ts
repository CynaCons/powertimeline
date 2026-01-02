/**
 * Firebase Authentication Service
 * Handles user authentication with email/password and Google OAuth
 * v0.5.1 - Enhanced with user profile creation
 */

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  deleteUser as deleteFirebaseUser,
  type User as FirebaseUser,
} from 'firebase/auth';
import { app } from '../lib/firebase';
import { createUser, getUser } from './firestore';
import type { User } from '../types';

/**
 * Ensure a user profile exists in Firestore
 * Creates one if it doesn't exist (for users who signed up before profile creation was added)
 * v0.5.6 - Exported for use in AuthContext on session restore
 */
export async function ensureUserProfile(firebaseUser: FirebaseUser): Promise<void> {
  const existingProfile = await getUser(firebaseUser.uid);
  if (!existingProfile) {
    // Create a basic profile for the user (SRS_DB.md compliant - v0.5.14)
    const userProfile: Omit<User, 'createdAt'> = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      username: firebaseUser.email?.split('@')[0] || firebaseUser.uid.slice(0, 8),
      role: 'user',
    };
    await createUser(userProfile);
  }
}

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google OAuth provider
const googleProvider = new GoogleAuthProvider();

/**
 * Create a new user account with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign up with email and password, and create user profile with username
 * v0.5.1 - Enhanced registration with user profile creation
 */
export async function signUpWithEmailAndCreateProfile(
  email: string,
  password: string,
  username: string,
  displayName?: string // Deprecated - kept for API compatibility
): Promise<FirebaseUser> {
  void displayName; // Suppress unused variable warning
  // Create Firebase Auth account
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // Create Firestore user profile (SRS_DB.md compliant - v0.5.14)
  const userProfile: Omit<User, 'createdAt'> = {
    id: firebaseUser.uid,
    email: email,
    username: username.toLowerCase(),
    role: 'user',
  };

  await createUser(userProfile);

  return firebaseUser;
}

/**
 * Sign in existing user with email and password
 * v0.5.6 - Now ensures user profile exists in Firestore
 */
export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // Ensure user has a Firestore profile (for users who registered before profile creation)
  await ensureUserProfile(firebaseUser);

  return firebaseUser;
}

/**
 * Sign in with Google OAuth
 * v0.5.6 - Now ensures user profile exists in Firestore
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const firebaseUser = userCredential.user;

  // Ensure user has a Firestore profile (first-time Google sign-in creates profile)
  await ensureUserProfile(firebaseUser);

  return firebaseUser;
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to authentication state changes
 * @param callback Function called when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Delete the current user's Firebase Auth account
 * v0.9.0 - Account deletion feature (GDPR compliance)
 * Note: User must be recently authenticated for this to succeed
 */
export async function deleteCurrentUserAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }
  await deleteFirebaseUser(user);
}
