/**
 * Authentication Context
 * Provides global Firebase Auth state management
 * v0.5.1 - Phase 1: Auth Foundation
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithEmail,
  signUpWithEmailAndCreateProfile,
  signInWithGoogle,
  signOutUser,
  onAuthStateChange,
} from '../services/auth';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, displayName?: string) => Promise<void>;
  signInWithGoogleOAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        logger.info('User authenticated', {
          uid: firebaseUser.uid,
          email: firebaseUser.email
        });
      } else {
        logger.info('User signed out');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      logger.info('Sign in successful', { email });
    } catch (error) {
      logger.error('Sign in failed', { error });
      throw error;
    }
  };

  const handleSignUp = async (
    email: string,
    password: string,
    username: string,
    displayName?: string
  ) => {
    try {
      await signUpWithEmailAndCreateProfile(email, password, username, displayName);
      logger.info('Sign up successful', { email, username });
    } catch (error) {
      logger.error('Sign up failed', { error });
      throw error;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      logger.info('Google sign in successful');
    } catch (error) {
      logger.error('Google sign in failed', { error });
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      logger.info('Sign out successful');
    } catch (error) {
      logger.error('Sign out failed', { error });
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogleOAuth: handleGoogleSignIn,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access auth context
 * Throws error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
