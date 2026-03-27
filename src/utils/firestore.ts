import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AppData } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const defaultData: AppData = {
  channels: [],
  records: {},
};

export const syncDataToFirestore = async (userId: string, data: AppData) => {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), {
      uid: userId,
      name: auth.currentUser?.displayName || 'User',
      email: auth.currentUser?.email || 'no-email@example.com',
      channels: data.channels,
      records: data.records,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeToUserData = (userId: string, onData: (data: AppData) => void) => {
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, 'users', userId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onData({
          channels: data.channels || [],
          records: data.records || {},
        });
      } else {
        // Initialize if not exists
        syncDataToFirestore(userId, defaultData);
        onData(defaultData);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};
