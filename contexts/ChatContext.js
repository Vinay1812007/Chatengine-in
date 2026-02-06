import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  addDoc
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);
const makeChatId = (a, b) => [a, b].sort().join('_');

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!user) return undefined;
    const chatsQ = query(collection(db, 'chats'), where('memberIds', 'array-contains', user.uid));
    const unsub = onSnapshot(chatsQ, (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      next.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setChats(next);
      if (!activeChatId && next[0]) setActiveChatId(next[0].id);
    });
    return () => unsub();
  }, [user, activeChatId]);

  useEffect(() => {
    if (!activeChatId) return undefined;
    const msgsQ = query(collection(db, 'chats', activeChatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(msgsQ, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [activeChatId]);

  const startDirectChat = async (targetUser) => {
    if (!user || !targetUser?.uid) return;
    const chatId = makeChatId(user.uid, targetUser.uid);
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        id: chatId,
        isGroup: false,
        title: targetUser.displayName,
        photoURL: targetUser.photoURL || '',
        memberIds: [user.uid, targetUser.uid],
        memberMeta: {
          [user.uid]: { isAdmin: true },
          [targetUser.uid]: { isAdmin: false }
        },
        pinnedMessageId: '',
        typing: {},
        draftByUser: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    setActiveChatId(chatId);
  };

  const createGroup = async (title, members) => {
    if (!user) return;
    const chatRef = doc(collection(db, 'chats'));
    const memberIds = [...new Set([user.uid, ...members.map((m) => m.uid)])];
    await setDoc(chatRef, {
      id: chatRef.id,
      isGroup: true,
      title,
      photoURL: '',
      memberIds,
      memberMeta: memberIds.reduce((acc, uid) => ({ ...acc, [uid]: { isAdmin: uid === user.uid } }), {}),
      pinnedMessageId: '',
      typing: {},
      draftByUser: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setActiveChatId(chatRef.id);
  };

  const updateTyping = async (value) => {
    if (!activeChatId || !user) return;
    await updateDoc(doc(db, 'chats', activeChatId), {
      [`typing.${user.uid}`]: value,
      updatedAt: serverTimestamp()
    }).catch(() => null);
  };

  const updateDraft = async (value) => {
    if (!activeChatId || !user) return;
    await updateDoc(doc(db, 'chats', activeChatId), {
      [`draftByUser.${user.uid}`]: value,
      updatedAt: serverTimestamp()
    }).catch(() => null);
  };

  const sendMessage = async ({ text, media = null, replyToId = '', poll = null }) => {
    if (!activeChatId || !user) return null;
    const payload = {
      text: text || '',
      media,
      senderId: user.uid,
      createdAt: serverTimestamp(),
      editedAt: null,
      deletedFor: [],
      deletedForEveryone: false,
      readBy: [user.uid],
      deliveredTo: [user.uid],
      starredBy: [],
      reactions: {},
      replyToId,
      poll,
      forwardedFrom: ''
    };
    const newDoc = await addDoc(collection(db, 'chats', activeChatId, 'messages'), payload);
    await updateDoc(doc(db, 'chats', activeChatId), {
      lastMessage: text || media?.name || poll?.question || 'Media',
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`typing.${user.uid}`]: false,
      [`draftByUser.${user.uid}`]: ''
    });
    return newDoc.id;
  };

  const editMessage = async (messageId, text) => updateDoc(doc(db, 'chats', activeChatId, 'messages', messageId), { text, editedAt: serverTimestamp() });

  const deleteMessage = async (messageId, forEveryone) => {
    const msgRef = doc(db, 'chats', activeChatId, 'messages', messageId);
    if (forEveryone) return updateDoc(msgRef, { deletedForEveryone: true, text: 'Message removed' });
    return updateDoc(msgRef, { deletedFor: arrayUnion(user.uid) });
  };

  const toggleStar = async (messageId, starred) => updateDoc(doc(db, 'chats', activeChatId, 'messages', messageId), {
    starredBy: starred ? arrayRemove(user.uid) : arrayUnion(user.uid)
  });

  const reactToMessage = async (messageId, emoji) => updateDoc(doc(db, 'chats', activeChatId, 'messages', messageId), {
    [`reactions.${user.uid}`]: emoji
  });

  const pinMessage = async (messageId) => updateDoc(doc(db, 'chats', activeChatId), { pinnedMessageId: messageId || '', updatedAt: serverTimestamp() });
  const clearPin = async () => updateDoc(doc(db, 'chats', activeChatId), { pinnedMessageId: '', updatedAt: serverTimestamp() });
  const votePoll = async (messageId, optionIndex) => updateDoc(doc(db, 'chats', activeChatId, 'messages', messageId), {
    [`poll.votes.${optionIndex}`]: increment(1),
    [`poll.voters.${user.uid}`]: optionIndex
  });

  const createPoll = async ({ question, options }) => sendMessage({
    poll: {
      question,
      options,
      votes: options.reduce((acc, _, i) => ({ ...acc, [i]: 0 }), {}),
      voters: {}
    }
  });

  const forwardMessage = async (message, targetChatId) => {
    await addDoc(collection(db, 'chats', targetChatId, 'messages'), {
      ...message,
      forwardedFrom: activeChatId,
      createdAt: serverTimestamp(),
      readBy: [user.uid],
      deliveredTo: [user.uid]
    });
  };

  const markRead = async (messageId) => {
    if (!user || !activeChatId) return;
    await updateDoc(doc(db, 'chats', activeChatId, 'messages', messageId), { readBy: arrayUnion(user.uid) }).catch(() => null);
  };

  const uploadMedia = (file, onProgress) =>
    new Promise((resolve, reject) => {
      const mediaType = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'file';
      const path = `uploads/chats/${activeChatId}/${mediaType}/${Date.now()}_${file.name}`;
      const uploadTask = uploadBytesResumable(ref(storage, path), file);
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.(progress);
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ progress: 100, stage: 'done', url, name: file.name, contentType: file.type });
        }
      );
    });

  const blockUser = async (targetUid) => user && updateDoc(doc(db, 'users', user.uid), { blockedUsers: arrayUnion(targetUid) });
  const unblockUser = async (targetUid) => user && updateDoc(doc(db, 'users', user.uid), { blockedUsers: arrayRemove(targetUid) });

  const findUsersByUsername = async (username) => {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snaps = await getDocs(q);
    return snaps.docs.map((d) => d.data());
  };

  const activeChat = useMemo(() => chats.find((c) => c.id === activeChatId) || null, [chats, activeChatId]);

  return <ChatContext.Provider value={{ chats, activeChat, activeChatId, messages, setActiveChatId, startDirectChat, createGroup, sendMessage, editMessage, deleteMessage, toggleStar, reactToMessage, pinMessage, clearPin, updateTyping, updateDraft, markRead, votePoll, createPoll, forwardMessage, uploadMedia, blockUser, unblockUser, findUsersByUsername }}>{children}</ChatContext.Provider>;
};

export const useChat = () => useContext(ChatContext);
