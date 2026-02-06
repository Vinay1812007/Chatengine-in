import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db, now } from './firebase';

const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];

export const createPeerConnection = (onTrack) => {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  pc.ontrack = (event) => onTrack(event.streams[0]);
  return pc;
};

export const subscribeOffer = (callId, cb) => onSnapshot(doc(db, 'calls', callId), (snap) => cb(snap.data()));

export const subscribeCandidates = (callId, side, cb) =>
  onSnapshot(collection(db, 'calls', callId, `${side}Candidates`), (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === 'added') cb(change.doc.data());
    });
  });

export const sendCandidate = async (callId, side, candidate) => {
  await addDoc(collection(db, 'calls', callId, `${side}Candidates`), candidate.toJSON());
};

export const createCallSignal = async ({ callId, callerId, calleeId, offer }) => {
  await setDoc(doc(db, 'calls', callId), {
    callerId,
    calleeId,
    offer,
    status: 'ringing',
    createdAt: now(),
    updatedAt: now()
  });
};

export const answerCallSignal = async ({ callId, answer }) => {
  await updateDoc(doc(db, 'calls', callId), {
    answer,
    status: 'active',
    updatedAt: now()
  });
};

export const endCallSignal = async (callId) => {
  await updateDoc(doc(db, 'calls', callId), { status: 'ended', updatedAt: now() }).catch(() => null);
  await deleteDoc(doc(db, 'calls', callId)).catch(() => null);
};
