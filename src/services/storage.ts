import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'kreativa_lms_auth_token',
  STUDENT_PROFILE: 'kreativa_lms_student_profile',
  SESSION_TIMESTAMP: 'kreativa_lms_session_timestamp',
};

// Direct native bridge in Expo Go (Android/iOS)
const RNC =
  NativeModules.RNCAsyncStorage ||
  NativeModules.RNC_AsyncSQLiteDBStorage ||
  NativeModules.PlatformLocalStorage;

const nativeMultiGet = (key: string): Promise<string | null> => {
  return new Promise((resolve) => {
    if (RNC?.multiGet) {
      RNC.multiGet([key], (errors: any, result: any) => {
        if (!errors && result && result[0]) {
          resolve(result[0][1]);
        } else {
          resolve(null);
        }
      });
    } else {
      resolve(null);
    }
  });
};

const nativeMultiSet = (key: string, value: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (RNC?.multiSet) {
      RNC.multiSet([[key, value]], (errors: any) => {
        if (!errors) {
          resolve();
        } else {
          reject(errors[0]);
        }
      });
    } else {
      resolve();
    }
  });
};

const nativeMultiRemove = (key: string): Promise<void> => {
  return new Promise((resolve) => {
    if (RNC?.multiRemove) {
      RNC.multiRemove([key], () => resolve());
    } else {
      resolve();
    }
  });
};

// In-memory fallback cache
const memoryStorage: Record<string, string> = {};

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      // 1. Try standard AsyncStorage
      const val = await AsyncStorage.getItem(key);
      if (val !== null && val !== undefined) return val;

      // 2. Try direct native module
      if (RNC?.multiGet) {
        const nativeVal = await nativeMultiGet(key);
        if (nativeVal !== null && nativeVal !== undefined) return nativeVal;
      }

      return memoryStorage[key] || null;
    } catch {
      // 3. Fallback to direct native module if AsyncStorage threw
      if (RNC?.multiGet) {
        try {
          const nativeVal = await nativeMultiGet(key);
          if (nativeVal !== null) return nativeVal;
        } catch {
          // ignore
        }
      }
      return memoryStorage[key] || null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryStorage[key] = value;
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }

      // Try AsyncStorage
      try {
        await AsyncStorage.setItem(key, value);
      } catch {
        // If AsyncStorage threw, save via direct native module
      }

      // Guarantee persistence through native module in Expo Go
      if (RNC?.multiSet) {
        await nativeMultiSet(key, value);
      }
    } catch {
      // Stored in memoryStorage as fallback
    }
  },

  async removeItem(key: string): Promise<void> {
    delete memoryStorage[key];
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      try {
        await AsyncStorage.removeItem(key);
      } catch {
        // ignore
      }
      if (RNC?.multiRemove) {
        await nativeMultiRemove(key);
      }
    } catch {
      // Memory storage removed
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
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.STUDENT_PROFILE);
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_TIMESTAMP);
    } catch {
      // Ignore clear errors
    }
  },

  // --- Specialized Session Helpers ---
  async getAuthToken(): Promise<string | null> {
    const token = await this.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token || typeof token !== 'string') return null;
    const trimmed = token.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
      return null;
    }
    return trimmed;
  },

  async setAuthToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async removeAuthToken(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async getStudentSession(): Promise<any | null> {
    const raw = await this.getItem(STORAGE_KEYS.STUDENT_PROFILE);
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
      return null;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || (!parsed.email && !parsed.studentId && !parsed.userId)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  async setStudentSession(profile: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(profile));
    await this.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, String(Date.now()));
  },

  async clearAllSession(): Promise<void> {
    // 1. Wipe in-memory storage immediately
    delete memoryStorage[STORAGE_KEYS.AUTH_TOKEN];
    delete memoryStorage[STORAGE_KEYS.STUDENT_PROFILE];
    delete memoryStorage[STORAGE_KEYS.SESSION_TIMESTAMP];

    // 2. Overwrite with empty string in native SQLite so no stale value lingers
    try {
      if (RNC?.multiSet) {
        await nativeMultiSet(STORAGE_KEYS.AUTH_TOKEN, '');
        await nativeMultiSet(STORAGE_KEYS.STUDENT_PROFILE, '');
        await nativeMultiSet(STORAGE_KEYS.SESSION_TIMESTAMP, '');
      }
    } catch {
      // ignore
    }

    // 3. Remove keys from native storage and AsyncStorage
    await this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await this.removeItem(STORAGE_KEYS.STUDENT_PROFILE);
    await this.removeItem(STORAGE_KEYS.SESSION_TIMESTAMP);
  },
};

export default storage;

