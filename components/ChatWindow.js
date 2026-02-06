import { useMemo, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import MessageBubble from './MessageBubble';
import Composer from './Composer';
import GlassPanel from './GlassPanel';
import styles from '../styles/chat.module.css';

const ChatWindow = () => {
  const {
    activeChat,
    messages,
    toggleStar,
    reactToMessage,
    deleteMessage,
    editMessage,
    pinMessage,
    clearPin
  } = useChat();
  const [replyToId, setReplyToId] = useState('');

  const pinned = useMemo(
    () => messages.find((message) => message.id === activeChat?.pinnedMessageId),
    [messages, activeChat?.pinnedMessageId]
  );

  if (!activeChat) {
    return (
      <GlassPanel className={styles.emptyState}>
        <p>Select a chat to begin messaging.</p>
      </GlassPanel>
    );
  }

  const onEdit = async (id) => {
    const text = window.prompt('Edit message');
    if (text !== null) await editMessage(id, text);
  };

  return (
    <GlassPanel className={styles.chatWindow}>
      <header className={styles.chatHeader}>
        <div>
          <h2>{activeChat.title || 'Conversation'}</h2>
          <small>{Object.values(activeChat.typing || {}).some(Boolean) ? 'typing...' : 'online'}</small>
        </div>
        <button onClick={() => (pinned ? clearPin() : pinMessage(messages[messages.length - 1]?.id))}>
          {pinned ? 'Unpin' : 'Pin latest'}
        </button>
      </header>

      {pinned ? <aside className={styles.pinned}>📌 {pinned.text || pinned.media?.name}</aside> : null}

      <div className={styles.messageList}>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onReply={setReplyToId}
            onStar={toggleStar}
            onReact={reactToMessage}
            onDelete={deleteMessage}
            onEdit={onEdit}
          />
        ))}
      </div>
      {replyToId ? <div className={styles.replyBanner}>Replying to #{replyToId}</div> : null}
      <Composer replyToId={replyToId} onClearReply={() => setReplyToId('')} />
    </GlassPanel>
  );
};

export default ChatWindow;
