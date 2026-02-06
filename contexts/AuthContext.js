import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db, provider, hasFirebaseConfig } from '../lib/firebase';
import { auth, db, provider } from '../lib/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncUserDoc = useCallback(async (authUser) => {
    if (!db) return;
    const userRef = doc(db, 'users', authUser.uid);
    const existing = await getDoc(userRef);
    const usernameSeed = (authUser.displayName || authUser.email?.split('@')[0] || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);

    if (!existing.exists()) {
      await setDoc(userRef, {
        uid: authUser.uid,
        displayName: authUser.displayName || 'Anonymous',
        email: authUser.email || '',
        photoURL: authUser.photoURL || '',
        username: `${usernameSeed}_${authUser.uid.slice(0, 5)}`,
        about: 'Available',
        lastSeen: serverTimestamp(),
        online: true,
        blockedUsers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(userRef, {
        displayName: authUser.displayName || 'Anonymous',
        photoURL: authUser.photoURL || '',
        email: authUser.email || '',
        online: true,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }, []);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return undefined;
    }

    const unsub = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) await syncUserDoc(authUser);
    const unsub = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        await syncUserDoc(authUser);
      }
      setUser(authUser);
      setLoading(false);
    });

    const handleBeforeUnload = async () => {
      if (!auth.currentUser) return;
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        online: false,
        lastSeen: serverTimestamp()
      }).catch(() => null);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsub();
    };
  }, [syncUserDoc]);

  const loginWithGoogle = async () => {
    if (!auth || !provider) throw new Error('Firebase config missing. Add NEXT_PUBLIC_FIREBASE_* variables.');
    return signInWithPopup(auth, provider);
  };

  const logout = async () => {
    if (!auth || !db) return;
  const loginWithGoogle = async () => signInWithPopup(auth, provider);

  const logout = async () => {
    if (auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        online: false,
        lastSeen: serverTimestamp()
      }).catch(() => null);
    }
    await signOut(auth);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithGoogle,
      logout,
      hasFirebaseConfig
      logout
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
