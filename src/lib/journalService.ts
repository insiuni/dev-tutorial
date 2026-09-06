import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, sanitizePayload } from './firebase';
import { JournalInteraction, OperationType } from '../types';

/**
 * Real-time subscription to the authenticated user's interactions list
 */
export function subscribeToUserInteractions(
  userId: string,
  onUpdate: (interactions: JournalInteraction[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const collectionPath = `users/${userId}/interactions`;
  const q = query(
    collection(db, 'users', userId, 'interactions'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const results: JournalInteraction[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<JournalInteraction, 'id'>),
      }));
      onUpdate(results);
    },
    (error) => {
      console.error('Snapshot listener error:', error);
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (err: any) {
        if (onError) onError(err);
      }
    }
  );
}

/**
 * Save a new interaction to the user's isolated Firestore subcollection
 */
export async function createJournalInteraction(
  userId: string,
  interaction: Omit<JournalInteraction, 'id' | 'userId'>
): Promise<string> {
  const collectionPath = `users/${userId}/interactions`;
  const sanitized = sanitizePayload({
    ...interaction,
    userId,
    createdAt: interaction.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  try {
    const docRef = await addDoc(
      collection(db, 'users', userId, 'interactions'),
      sanitized
    );
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
  }
}

/**
 * Update an existing interaction document
 */
export async function updateJournalInteraction(
  userId: string,
  interactionId: string,
  updates: Partial<JournalInteraction>
): Promise<void> {
  const docPath = `users/${userId}/interactions/${interactionId}`;
  const sanitized = sanitizePayload({
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  try {
    const docRef = doc(db, 'users', userId, 'interactions', interactionId);
    await updateDoc(docRef, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

/**
 * Delete an interaction document
 */
export async function deleteJournalInteraction(
  userId: string,
  interactionId: string
): Promise<void> {
  const docPath = `users/${userId}/interactions/${interactionId}`;
  try {
    const docRef = doc(db, 'users', userId, 'interactions', interactionId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
