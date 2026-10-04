import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface FirestoreActivity {
  id?: string;
  type: 'view' | 'cart' | 'order' | 'print';
  message: string;
  timestamp: any;
}

export async function recordLiveActivity(type: 'view' | 'cart' | 'order' | 'print', message: string) {
  try {
    const colRef = collection(db, 'live_activity');
    await addDoc(colRef, {
      type,
      message,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firebase activity log fallback:', err);
  }
}

export function subscribeToLiveActivity(callback: (events: FirestoreActivity[]) => void) {
  try {
    const colRef = collection(db, 'live_activity');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(15));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: FirestoreActivity[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as any) });
        });
        callback(items);
      },
      (error) => {
        console.warn('Live activity listener error:', error);
      }
    );
  } catch (err) {
    console.warn('Firebase subscribe fallback:', err);
    return () => {};
  }
}
