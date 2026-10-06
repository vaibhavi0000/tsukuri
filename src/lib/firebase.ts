import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
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

// Real-time Firestore Product Persistence (Works on Vercel, mobile, desktop & local dev)
export async function saveProductToFirestore(product: any): Promise<boolean> {
  try {
    const docRef = doc(db, 'tsukuri_products', String(product.id));
    const cleanProd = JSON.parse(JSON.stringify(product));
    cleanProd.updatedAt = new Date().toISOString();

    // Guard: Prevent oversized base64 strings from exceeding Firestore 1MB document limit
    if (typeof cleanProd.videoUrl === 'string' && cleanProd.videoUrl.length > 300000 && cleanProd.videoUrl.startsWith('data:')) {
      cleanProd.videoUrl = '';
    }
    if (Array.isArray(cleanProd.carouselVideos)) {
      cleanProd.carouselVideos = cleanProd.carouselVideos.map((v: any) => {
        if (typeof v.url === 'string' && v.url.length > 300000 && v.url.startsWith('data:')) {
          return { ...v, url: '' };
        }
        return v;
      });
    }
    if (Array.isArray(cleanProd.images)) {
      cleanProd.images = cleanProd.images.map((img: any) => {
        if (typeof img === 'string' && img.length > 400000 && img.startsWith('data:')) {
          return 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=700';
        }
        return img;
      });
    }

    await setDoc(docRef, cleanProd, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore saveProduct error:', err);
    return false;
  }
}

export async function deleteProductFromFirestore(id: number | string): Promise<boolean> {
  try {
    const docRef = doc(db, 'tsukuri_products', String(id));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('Firestore deleteProduct error:', err);
    return false;
  }
}

export function subscribeToProducts(callback: (products: any[]) => void) {
  try {
    const colRef = collection(db, 'tsukuri_products');
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: any[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data());
          });
          // Sort by id so newest drops appear first, or preserve natural order
          list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
          callback(list);
        }
      },
      (error) => {
        console.warn('Firestore products subscription warning:', error);
      }
    );
  } catch (err) {
    console.warn('Firestore subscribeToProducts error:', err);
    return () => {};
  }
}

export async function seedProductsIfEmpty(initialProducts: any[]) {
  try {
    const colRef = collection(db, 'tsukuri_products');
    const snap = await getDocs(colRef);
    if (snap.empty && Array.isArray(initialProducts) && initialProducts.length > 0) {
      for (const p of initialProducts) {
        await saveProductToFirestore(p);
      }
    }
  } catch (err) {
    console.warn('Firestore seed warning:', err);
  }
}

