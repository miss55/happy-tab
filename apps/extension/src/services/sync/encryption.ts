import type { SyncSnapshot } from "./types";

const ENCRYPTION_PREFIX = "enc:v1:";
const SALT_BYTES = 16;
const IV_BYTES = 12;

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const deriveKey = async (passphrase: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(encoder.encode(passphrase)).buffer as ArrayBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptPayload = async (rawString: string, passphrase?: string): Promise<string> => {
  if (!passphrase || passphrase.trim() === "") {
    return rawString;
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);

  const encoder = new TextEncoder();
  const encodedData = encoder.encode(rawString);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    encodedData
  );

  const payload = {
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    data: arrayBufferToBase64(encryptedBuffer)
  };

  return ENCRYPTION_PREFIX + JSON.stringify(payload);
};

export const decryptPayload = async (payloadString: string, passphrase?: string): Promise<string> => {
  if (!payloadString.startsWith(ENCRYPTION_PREFIX)) {
    return payloadString;
  }

  if (!passphrase || passphrase.trim() === "") {
    throw new Error("Payload is encrypted but no decryption key was provided.");
  }

  try {
    const jsonStr = payloadString.slice(ENCRYPTION_PREFIX.length);
    const parsed = JSON.parse(jsonStr);
    const salt = new Uint8Array(base64ToArrayBuffer(parsed.salt));
    const iv = new Uint8Array(base64ToArrayBuffer(parsed.iv));
    const encryptedData = base64ToArrayBuffer(parsed.data);

    const key = await deriveKey(passphrase, salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error("Failed to decrypt payload. Please check your encryption password.");
  }
};

export const isEncryptedPayload = (payloadString: string): boolean => {
  return payloadString.startsWith(ENCRYPTION_PREFIX);
};
