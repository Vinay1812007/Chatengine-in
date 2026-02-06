import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import GlassPanel from '../components/GlassPanel';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import styles from '../styles/chat.module.css';

export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ username: '', about: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (user) {
      setForm((prev) => ({ ...prev, username: user.displayName?.toLowerCase().replace(/\s+/g, '_') || '', about: '' }));
    }
  }, [user]);

  const save = async () => {
    if (!user) return;
    setStatus('Checking username...');
    const username = form.username.toLowerCase();
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snaps = await getDocs(q);
    const occupied = snaps.docs.some((d) => d.id !== user.uid);
    if (occupied) {
      setStatus('Username is already taken');
      return;
    }

    await updateDoc(doc(db, 'users', user.uid), {
      username,
      about: form.about,
      updatedAt: serverTimestamp()
    });
    setStatus('Saved');
  };

  return (
    <main className={styles.pageWrap}>
      <GlassPanel className={styles.settingsCard}>
        <h1>Profile Settings</h1>
        <label>
          Username
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </label>
        <label>
          About
          <textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
        </label>
        <button onClick={save}>Save</button>
        <p>{status}</p>
        <Link href="/">← Back</Link>
      </GlassPanel>
    </main>
  );
}
