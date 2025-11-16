import { GoogleGenAI } from '@google/genai';

interface ApiKeys {
    geminiKey: string;
}

let inMemoryKeys: ApiKeys | null = null;

async function getEncryptionKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

async function encrypt(data: string, password: string): Promise<string> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await getEncryptionKey(password, salt);
    const enc = new TextEncoder();
    const encoded = enc.encode(data);
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoded
    );
    
    const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
}

async function decrypt(encryptedData: string, password: string): Promise<string> {
    const data = atob(encryptedData);
    const combined = new Uint8Array(data.length).map((_, i) => data.charCodeAt(i));
    
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 16 + 12);
    const ciphertext = combined.slice(16 + 12);

    const key = await getEncryptionKey(password, salt);
    const dec = new TextDecoder();
    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
    );
    
    return dec.decode(decrypted);
}

export const saveApiKeys = async (keys: ApiKeys, password: string): Promise<void> => {
    const dataToEncrypt = JSON.stringify(keys);
    const encrypted = await encrypt(dataToEncrypt, password);
    localStorage.setItem('encryptedApiKeys', encrypted);
    inMemoryKeys = keys;
};

export const loadApiKeys = async (password: string): Promise<void> => {
    const encrypted = localStorage.getItem('encryptedApiKeys');
    if (!encrypted) {
        throw new Error("No API keys found in storage.");
    }
    const decrypted = await decrypt(encrypted, password);
    inMemoryKeys = JSON.parse(decrypted);
};

export const getGeminiKey = (): string | null => {
    return inMemoryKeys ? inMemoryKeys.geminiKey : null;
};

export const hasApiKeysInStorage = (): boolean => {
    return localStorage.getItem('encryptedApiKeys') !== null;
};

export const getAiClient = (): GoogleGenAI => {
    const apiKey = getGeminiKey();
    if (!apiKey) {
        throw new Error("Google Gemini API Key is not set. Please configure it in the API Key Manager.");
    }
    return new GoogleGenAI({ apiKey });
};
