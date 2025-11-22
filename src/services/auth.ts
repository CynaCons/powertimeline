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
  type User as FirebaseUser,
} from 'firebase/auth';
import { app } from '../lib/firebase';
import { createUser } from './firestore';
import type { User } from '../types';

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
  displayName?: string
): Promise<FirebaseUser> {
  // Create Firebase Auth account
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // Create Firestore user profile
  const userProfile: Omit<User, 'createdAt'> = {
    id: firebaseUser.uid,
    email: email,
    username: username.toLowerCase(),
    name: displayName || username,
    avatar: '👤', // Default avatar
    role: 'user',
  };

  await createUser(userProfile);

  return firebaseUser;
}

/**
 * Sign in existing user with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const userCredential = await signInWithPopup(auth, googleProvider);
  return userCredential.user;
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
