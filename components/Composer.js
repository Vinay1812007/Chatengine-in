import { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import styles from '../styles/chat.module.css';

const Composer = ({ replyToId = '', onClearReply = () => {} }) => {
  const { user } = useAuth();
  const { sendMessage, updateTyping, updateDraft, activeChat, uploadMedia } = useChat();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState('');
  const fileRef = useRef(null);

  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    await sendMessage({ text, replyToId });
    setText('');
    onClearReply();
  };

  const onChange = async (value) => {
    setText(value);
    await updateTyping(Boolean(value));
    await updateDraft(value);
  };

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading('Uploading 0%');
    try {
      const media = await uploadMedia(file, (progress) => setUploading(`Uploading ${progress}%`));
      await sendMessage({ text, media, replyToId });
      setText('');
      onClearReply();
      setUploading('Uploaded');
      await updateDraft('');
      setTimeout(() => setUploading(''), 1200);
    } catch {
      setUploading('Upload failed');
    }
  };

  return (
    <form className={styles.composer} onSubmit={submit}>
      <input className={styles.composerInput} placeholder={activeChat?.draftByUser?.[user?.uid] || 'Write a message'} value={text} onChange={(e) => onChange(e.target.value)} />
      <input ref={fileRef} type="file" hidden onChange={onFile} />
      <button type="button" onClick={() => fileRef.current?.click()}>📎</button>
      <button type="submit">Send</button>
      {uploading ? <small>{uploading}</small> : null}
    </form>
  );
};

export default Composer;
