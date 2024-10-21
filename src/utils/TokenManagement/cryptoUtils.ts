// src/utils/cryptoUtils.ts

import { createTokenBindingId } from './clientTokenUtils';

export const generateKeyPair = async (): Promise<CryptoKeyPair> => {
  return await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );
};

export const exportPublicKey = async (publicKey: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey("raw", publicKey);
  const exportedKeyBuffer = new Uint8Array(exported);
  return btoa(String.fromCharCode.apply(null, exportedKeyBuffer as unknown as number[]));
};

export const generateClientKey = async (): Promise<string> => {
  const keyPair = await generateKeyPair();
  const publicKey = await exportPublicKey(keyPair.publicKey);
  const bindingId = await createTokenBindingId(publicKey);
  return bindingId;
};