import { Platform } from 'react-native';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'kreativa_lms_auth_token',
  STUDENT_PROFILE: 'kreativa_lms_student_profile',
  SESSION_TIMESTAMP: 'kreativa_lms_session_timestamp',
};

// In-memory fallback cache
const memoryStorage: Record<string, string> = {};

// Safe AsyncStorage dynamic loader (works even if package is not yet natively linked)
let nativeAsyncStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  nativeAsyncStorage = require('@react-native-async-storage/async-storage')?.default || null;
} catch {
  nativeAsyncStorage = null;
}

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      if (nativeAsyncStorage) {
        return await nativeAsyncStorage.getItem(key);
      }
      return memoryStorage[key] || null;
    } catch {
      return memoryStorage[key] || null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      memoryStorage[key] = value;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      if (nativeAsyncStorage) {
        await nativeAsyncStorage.setItem(key, value);
      }
    } catch {
      memoryStorage[key] = value;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      delete memoryStorage[key];
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      if (nativeAsyncStorage) {
        await nativeAsyncStorage.removeItem(key);
      }
    } catch {
      delete memoryStorage[key];
    }
  },

  async clear(): Promise<void> {
    try {
      Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        window.localStorage.removeItem(STORAGE_KEYS.STUDENT_PROFILE);
        window.localStorage.removeItem(STORAGE_KEYS.SESSION_TIMESTAMP);
        return;
      }
      if (nativeAsyncStorage) {
        await nativeAsyncStorage.multiRemove([
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.STUDENT_PROFILE,
          STORAGE_KEYS.SESSION_TIMESTAMP,
        ]);
      }
    } catch {
      // Ignore clear errors
    }
  },

  // --- Specialized Session Helpers ---
  async getAuthToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async setAuthToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async removeAuthToken(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async getStudentSession(): Promise<any | null> {
    const raw = await this.getItem(STORAGE_KEYS.STUDENT_PROFILE);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async setStudentSession(profile: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(profile));
    await this.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, String(Date.now()));
  },

  async clearAllSession(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await this.removeItem(STORAGE_KEYS.STUDENT_PROFILE);
    await this.removeItem(STORAGE_KEYS.SESSION_TIMESTAMP);
  },
};

export default storage;

