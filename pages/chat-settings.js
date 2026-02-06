import Link from 'next/link';
import { useState } from 'react';
import GlassPanel from '../components/GlassPanel';
import { useChat } from '../contexts/ChatContext';
import styles from '../styles/chat.module.css';

export default function ChatSettingsPage() {
  const { activeChat, blockUser, unblockUser, createGroup, findUsersByUsername } = useChat();
  const [username, setUsername] = useState('');
  const [groupTitle, setGroupTitle] = useState('New Group');
  const [status, setStatus] = useState('');

  const onBlock = async () => {
    const target = activeChat?.memberIds?.[1];
    if (!target) return;
    await blockUser(target);
    setStatus('User blocked');
  };

  const onUnblock = async () => {
    const target = activeChat?.memberIds?.[1];
    if (!target) return;
    await unblockUser(target);
    setStatus('User unblocked');
  };

  const onCreateGroup = async () => {
    const users = await findUsersByUsername(username);
    if (!users.length) {
      setStatus('No users found');
      return;
    }
    await createGroup(groupTitle, users);
    setStatus(`Group "${groupTitle}" created`);
  };

  return (
    <main className={styles.pageWrap}>
      <GlassPanel className={styles.settingsCard}>
        <h1>Chat Settings</h1>
        <p>Active chat: {activeChat?.title || 'none selected'}</p>
        <div className={styles.rowButtons}>
          <button onClick={onBlock}>Block user</button>
          <button onClick={onUnblock}>Unblock user</button>
        </div>
        <label>
          Username to add
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="john_123" />
        </label>
        <label>
          Group title
          <input value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} />
        </label>
        <button onClick={onCreateGroup}>Create group</button>
        <p>{status}</p>
        <Link href="/">← Back</Link>
      </GlassPanel>
    </main>
  );
}
