import CryptoJS from 'crypto-js';
import { JSEncrypt } from 'jsencrypt';

/**
 * The api encrypt util, ports from plus-ui (RuoYi-Vue-Plus frontend)
 *
 * The protocol of RuoYi api encrypt:
 *
 * 1. generate a random 32 bit string as the AES key (utf8 bytes)
 * 2. AES-ECB-Pkcs7 encrypt the request body, and encode to base64 string
 * 3. RSA encrypt the base64 of the AES key by the public key, and set it to the `encrypt-key` header
 * 4. if the response header contains `encrypt-key`, decrypt it by the private key to get the AES key, then decrypt the response body
 */

const ENCRYPT_HEADER = 'encrypt-key';

const publicKey = import.meta.env.VITE_APP_RSA_PUBLIC_KEY || '';

// the frontend is not recommended to store the private key, it is only used to decrypt the response from the backend that enables response encryption
const privateKey = import.meta.env.VITE_APP_RSA_PRIVATE_KEY || '';

/** Whether the api encrypt is enabled */
export const isEncryptEnabled = () => import.meta.env.VITE_APP_ENCRYPT === 'Y';

/** Generate a random 32 char string as the AES key source */
function generateRandomString(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

/** The AES key is the utf8 bytes of the random string, keep same as the backend */
function createAesKey(): { word: CryptoJS.lib.WordArray; base64: string } {
  const word = CryptoJS.enc.Utf8.parse(generateRandomString());
  return { word, base64: CryptoJS.enc.Base64.stringify(word) };
}

function rsaEncrypt(text: string): string | false {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(publicKey);
  return encryptor.encrypt(text);
}

function rsaDecrypt(text: string): string | false {
  const encryptor = new JSEncrypt();
  encryptor.setPrivateKey(privateKey);
  return encryptor.decrypt(text);
}

/**
 * Encrypt the request data
 *
 * @param data The plain request body
 * @returns The encrypted body (base64 string) and the value of the `encrypt-key` header
 */
export function encryptRequest(data: unknown): { body: string; keyHeader: string } {
  const { word, base64 } = createAesKey();

  const keyHeader = rsaEncrypt(base64);
  if (keyHeader === false) {
    throw new Error('RSA encrypt failed, please check VITE_APP_RSA_PUBLIC_KEY');
  }

  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), word, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });

  return { body: encrypted.toString(), keyHeader };
}

/**
 * Decrypt the response data by the `encrypt-key` response header
 *
 * @param keyHeader The value of the `encrypt-key` header
 * @param data The encrypted response body (base64 string)
 */
export function decryptResponse(keyHeader: string, data: unknown): any {
  const base64Key = rsaDecrypt(keyHeader);
  if (base64Key === false) {
    throw new Error('RSA decrypt failed, please check VITE_APP_RSA_PRIVATE_KEY');
  }

  const word = CryptoJS.enc.Base64.parse(base64Key.toString());

  const cipher = typeof data === 'string' ? data : String(data);

  const decrypted = CryptoJS.AES.decrypt(cipher, word, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });

  const text = decrypted.toString(CryptoJS.enc.Utf8);

  return JSON.parse(text);
}

export { ENCRYPT_HEADER };
