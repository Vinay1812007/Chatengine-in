import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/chat.module.css';

const MessageBubble = ({ message, onReply, onStar, onReact, onDelete, onEdit }) => {
  const { user } = useAuth();
  const mine = message.senderId === user?.uid;

  const reactionSummary = useMemo(() => Object.values(message.reactions || {}), [message.reactions]);

  if (message.deletedForEveryone) {
    return <div className={`${styles.messageRow} ${mine ? styles.mine : ''}`}>Message removed</div>;
  }

  if (message.deletedFor?.includes(user?.uid)) return null;

  return (
    <div className={`${styles.messageRow} ${mine ? styles.mine : ''}`}>
      <div className={styles.messageBubble}>
        {message.replyToId ? <small>↩ Reply</small> : null}
        {message.media?.url ? (
          <a href={message.media.url} target="_blank" rel="noreferrer" className={styles.mediaLink}>
            {message.media.contentType?.startsWith('image') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={message.media.url} alt={message.media.name} className={styles.mediaPreview} />
            ) : (
              <span>📎 {message.media.name}</span>
            )}
          </a>
        ) : null}
        {message.text ? <p>{message.text}</p> : null}
        {reactionSummary.length ? <div className={styles.reactions}>{reactionSummary.join(' ')}</div> : null}
        <div className={styles.messageActions}>
          <button onClick={() => onReply(message.id)}>Reply</button>
          <button onClick={() => onStar(message.id, message.starredBy?.includes(user.uid))}>★</button>
          <button onClick={() => onReact(message.id, '👍')}>👍</button>
          {mine ? <button onClick={() => onEdit(message.id)}>Edit</button> : null}
          <button onClick={() => onDelete(message.id, mine)}>Delete</button>
        </div>
        <small>
          {message.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'now'} ·
          {message.readBy?.length > 1 ? ' Read' : message.deliveredTo?.length > 1 ? ' Delivered' : ' Sent'}
          {message.editedAt ? ' · edited' : ''}
        </small>
      </div>
    </div>
  );
};

export default MessageBubble;
