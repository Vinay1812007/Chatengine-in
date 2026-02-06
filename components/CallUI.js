import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import {
  answerCallSignal,
  createCallSignal,
  createPeerConnection,
  endCallSignal,
  sendCandidate,
  subscribeCandidates,
  subscribeOffer
} from '../lib/webrtc';
import styles from '../styles/chat.module.css';

const CallUI = () => {
  const { user } = useAuth();
  const { activeChat } = useChat();
  const [callState, setCallState] = useState('idle');
  const [callId, setCallId] = useState('');
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const pcRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => () => {
    if (pcRef.current) pcRef.current.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const setupLocal = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    streamRef.current = stream;
    if (localVideo.current) localVideo.current.srcObject = stream;
    return stream;
  };

  const startCall = async () => {
    if (!activeChat?.memberIds?.length) return;
    const target = activeChat.memberIds.find((id) => id !== user.uid);
    const stream = await setupLocal();
    const pc = createPeerConnection((remoteStream) => {
      if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
    });
    pcRef.current = pc;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    const nextCallId = `${activeChat.id}_${Date.now()}`;

    pc.onicecandidate = (event) => {
      if (event.candidate) sendCandidate(nextCallId, 'offer', event.candidate);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await createCallSignal({ callId: nextCallId, callerId: user.uid, calleeId: target, offer });

    subscribeCandidates(nextCallId, 'answer', async (candidate) => {
      await pc.addIceCandidate(candidate);
    });

    subscribeOffer(nextCallId, async (data) => {
      if (data?.answer && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(data.answer);
        setCallState('active');
      }
    });

    setCallId(nextCallId);
    setCallState('ringing');
  };

  const endCall = async () => {
    if (callId) await endCallSignal(callId);
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setCallState('idle');
    setCallId('');
  };

  return (
    <div className={styles.callWrap}>
      <button onClick={startCall} disabled={!activeChat || callState !== 'idle'}>Call</button>
      <button onClick={endCall} disabled={callState === 'idle'}>End</button>
      <small>{callState}</small>
      <div className={styles.videoGrid}>
        <video autoPlay muted ref={localVideo} playsInline />
        <video autoPlay ref={remoteVideo} playsInline />
      </div>
    </div>
  );
};

export default CallUI;
