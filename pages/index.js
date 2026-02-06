import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import CallUI from '../components/CallUI';
import GlassPanel from '../components/GlassPanel';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { db, hasFirebaseConfig } from '../lib/firebase';
import styles from '../styles/chat.module.css';

export default function HomePage() {
  const { user, loading, loginWithGoogle, logout } = useAuth();
  const [authError, setAuthError] = useState('');
  const { startDirectChat } = useChat();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!user || !db) return undefined;
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map((d) => d.data()).filter((u) => u.uid !== user.uid));
    });
    return () => unsub();
  }, [user]);

  if (loading) {
    return <main className={styles.center}>Loading...</main>;
  }

  if (!user) {
    return (
      <main className={styles.center}>
        <GlassPanel className={styles.loginCard}>
          <h1>Chatengine In</h1>
          <p>Secure cloud messaging with premium glass UI.</p>
          {!hasFirebaseConfig ? <p>Add NEXT_PUBLIC_FIREBASE_* variables to enable auth.</p> : null}
          {authError ? <p>{authError}</p> : null}
          <button onClick={async () => { try { setAuthError(''); await loginWithGoogle(); } catch (error) { setAuthError(error.message); } }} disabled={!hasFirebaseConfig}>Continue with Google</button>
        </GlassPanel>
      </main>
    );
  }

  return (
    <main className={styles.layout}>
      <aside className={styles.sidebar}>
        <header className={styles.sidebarHeader}>
          <h2>{user.displayName}</h2>
          <button onClick={logout}>Logout</button>
        </header>
        <ChatList />
        <GlassPanel className={styles.userDirectory}>
          <h3>Start new chat</h3>
          <ul>
            {users.map((candidate) => (
              <li key={candidate.uid}>
                <button onClick={() => startDirectChat(candidate)}>{candidate.displayName}</button>
              </li>
            ))}
          </ul>
        </GlassPanel>
        <nav className={styles.inlineNav}>
          <Link href="/settings">Settings</Link>
          <Link href="/chat-settings">Chat Settings</Link>
        </nav>
      </aside>
      <section className={styles.mainPane}>
        <ChatWindow />
        <CallUI />
      </section>
    </main>
  );
}
