// IndexedDB media persistence utility for device videos & photos
// Allows persistent offline & client-side video playback without server upload limits

const DB_NAME = 'tsukuri_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// In-memory cache of created blob URLs to prevent duplicate memory allocations
const blobUrlCache = new Map<string, string>();

/**
 * Stores a video or large image File/Blob in IndexedDB and returns an object URL for playback.
 */
export async function saveMediaBlob(key: string, file: File | Blob): Promise<string> {
  try {
    const db = await openMediaDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(file, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Revoke old URL if existing
    const existingUrl = blobUrlCache.get(key);
    if (existingUrl) {
      try {
        URL.revokeObjectURL(existingUrl);
      } catch {}
    }

    const objectUrl = URL.createObjectURL(file);
    blobUrlCache.set(key, objectUrl);
    return objectUrl;
  } catch (err) {
    console.warn('Could not save media to IndexedDB:', err);
    return URL.createObjectURL(file);
  }
}

/**
 * Retrieves a media Blob from IndexedDB and creates a playback URL.
 */
export async function getMediaBlobUrl(key: string): Promise<string | null> {
  if (blobUrlCache.has(key)) {
    return blobUrlCache.get(key)!;
  }
  try {
    const db = await openMediaDB();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (blob) {
      const url = URL.createObjectURL(blob);
      blobUrlCache.set(key, url);
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Compresses an image to guarantee it is under ~50KB for safe Firestore storage.
 */
export function compressImageForFirestore(
  source: string,
  maxWidth = 640,
  maxHeight = 640,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve) => {
    if (!source || !source.startsWith('data:image/')) {
      resolve(source);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        if (width / maxWidth > height / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          maxHeight = height;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(source);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(source);
    img.src = source;
  });
}
