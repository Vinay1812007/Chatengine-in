const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (arrBuffer) => {
  if (typeof window === 'undefined') return '';
  const bytes = new Uint8Array(arrBuffer);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return window.btoa(binary);
};

const fromBase64 = (encoded) => {
  if (typeof window === 'undefined') return new Uint8Array();
  const binary = window.atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

export const createRoomSecret = async () => {
  if (!globalThis.crypto?.subtle) return null;
  return globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
};

export const exportSecret = async (secret) => {
  if (!secret || !globalThis.crypto?.subtle) return '';
  const raw = await globalThis.crypto.subtle.exportKey('raw', secret);
  return toBase64(raw);
};

export const importSecret = async (rawSecret) => {
  if (!rawSecret || !globalThis.crypto?.subtle) return null;
  return globalThis.crypto.subtle.importKey('raw', fromBase64(rawSecret), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
};

export const encryptText = async (plainText, secret) => {
  if (!secret || !globalThis.crypto?.subtle) return { value: plainText, iv: '' };
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, secret, encoder.encode(plainText));
  return {
    value: toBase64(encrypted),
    iv: toBase64(iv)
  };
};

export const decryptText = async (cipherText, iv, secret) => {
  if (!cipherText || !iv || !secret || !globalThis.crypto?.subtle) return cipherText;
  try {
    const decrypted = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(iv) },
      secret,
      fromBase64(cipherText)
    );
    return decoder.decode(decrypted);
  } catch {
    return '[Unable to decrypt]';
  }
};
