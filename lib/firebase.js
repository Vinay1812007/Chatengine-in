import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeApp, getApps } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence
} from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

const app = hasFirebaseConfig ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

const auth = app ? getAuth(app) : null;
if (auth && typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(() => null);
}

const db = app ? getFirestore(app) : null;
const storage = app ? getStorage(app) : null;
const provider = app ? new GoogleAuthProvider() : null;
if (provider) provider.setCustomParameters({ prompt: 'select_account' });

const now = () => serverTimestamp();

export { app, auth, db, storage, provider, now, hasFirebaseConfig };
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => null);

const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const now = () => serverTimestamp();

export { app, auth, db, storage, provider, now };
