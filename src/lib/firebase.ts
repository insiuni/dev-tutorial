import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { FirestoreErrorInfo, OperationType } from '../types';

// Initialize Firebase app singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with exact database ID specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    const code = error?.code;
    let friendlyMessage = error?.message || 'Authentication failed.';
    if (code === 'auth/popup-closed-by-user') {
      friendlyMessage = 'Sign-in was closed before completing. Click again to continue.';
    } else if (code === 'auth/popup-blocked') {
      friendlyMessage = 'Sign-in popup was blocked by your browser. Please enable popups or open the app in a new tab.';
    } else if (code === 'auth/cancelled-popup-request') {
      friendlyMessage = 'Sign-in request was replaced by another attempt.';
    } else if (code === 'auth/unauthorized-domain') {
      friendlyMessage = 'This application domain is not authorized in Firebase Console > Authentication > Settings.';
    }
    const enhancedError = new Error(friendlyMessage);
    (enhancedError as any).code = code;
    console.warn('Sign-in issue:', friendlyMessage);
    throw enhancedError;
  }
}

export async function logOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
}

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Ensures no undefined values are sent to Firestore operations.
 */
export function sanitizePayload<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Standardized Firestore error handler for permission and operation diagnostics
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate Connection to Firestore on app boot
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.warn('Firebase client appears offline or cannot reach endpoint.');
    }
  }
}

// Run test on load
testConnection();
