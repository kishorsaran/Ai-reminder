import { doc, setDoc, onSnapshot, collection, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AppData, Channel, Board, Note, Prompt, UserSettings } from '../types';

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
      userId: 'focus-user-001',
      email: null,
      emailVerified: undefined,
      isAnonymous: undefined,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const defaultData: AppData = {
  channels: [],
  boards: [],
  notes: [],
  prompts: [],
};

// Subscriptions
export const subscribeToChannels = (userId: string, onData: (channels: Channel[]) => void) => {
  const path = `users/${userId}/channels`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const channels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
      channels.sort((a, b) => (a.order || 0) - (b.order || 0));
      onData(channels);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
};

export const subscribeToBoards = (userId: string, onData: (boards: Board[]) => void) => {
  const path = `users/${userId}/boards`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const boards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Board));
      onData(boards);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
};

export const subscribeToNotes = (userId: string, onData: (notes: Note[]) => void) => {
  const path = `users/${userId}/notes`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      onData(notes);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
};

export const subscribeToPrompts = (userId: string, onData: (prompts: Prompt[]) => void) => {
  const path = `users/${userId}/prompts`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const prompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prompt));
      onData(prompts);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
};

export const subscribeToSettings = (userId: string, onData: (settings: UserSettings | undefined) => void) => {
  const path = `users/${userId}/settings/analytics`;
  return onSnapshot(
    doc(db, path),
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as UserSettings);
      } else {
        onData(undefined);
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
};

// Mutations
export const saveSettings = async (userId: string, settings: UserSettings) => {
  const path = `users/${userId}/settings/analytics`;
  try {
    await setDoc(doc(db, path), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const saveChannel = async (userId: string, channel: Channel) => {
  const path = `users/${userId}/channels/${channel.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'channels', channel.id), channel);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteChannel = async (userId: string, channelId: string) => {
  const path = `users/${userId}/channels/${channelId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'channels', channelId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const saveBoard = async (userId: string, board: Board) => {
  const path = `users/${userId}/boards/${board.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'boards', board.id), board);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteBoard = async (userId: string, boardId: string) => {
  const path = `users/${userId}/boards/${boardId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'boards', boardId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const saveNote = async (userId: string, note: Note) => {
  const path = `users/${userId}/notes/${note.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'notes', note.id), note);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteNote = async (userId: string, noteId: string) => {
  const path = `users/${userId}/notes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'notes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const savePrompt = async (userId: string, prompt: Prompt) => {
  const path = `users/${userId}/prompts/${prompt.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'prompts', prompt.id), prompt);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deletePrompt = async (userId: string, promptId: string) => {
  const path = `users/${userId}/prompts/${promptId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'prompts', promptId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};
