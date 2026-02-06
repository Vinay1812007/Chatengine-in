import { useMemo, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import GlassPanel from './GlassPanel';
import styles from '../styles/chat.module.css';

const ChatList = () => {
  const { chats, activeChatId, setActiveChatId } = useChat();
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => chats.filter((chat) => (chat.title || '').toLowerCase().includes(search.toLowerCase())),
    [chats, search]
  );

  return (
    <GlassPanel className={styles.chatListWrap}>
      <input
        className={styles.searchInput}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search chats"
      />
      <ul className={styles.chatList}>
        {filtered.map((chat) => (
          <li key={chat.id}>
            <button
              className={`${styles.chatItem} ${chat.id === activeChatId ? styles.activeChatItem : ''}`}
              onClick={() => setActiveChatId(chat.id)}
            >
              <strong>{chat.title || 'Untitled Chat'}</strong>
              <span>{chat.lastMessage || 'No messages yet'}</span>
            </button>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
};

export default ChatList;
