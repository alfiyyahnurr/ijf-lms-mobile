import React, { createContext, useContext, useState, useEffect } from 'react';
import storage from '../services/storage';
import { api, setAuthToken } from '../services/api';
import { StudentProfile } from '../types';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userToken: string | null;
  studentUser: Partial<StudentProfile> | null;
  hasLoggedOut: boolean;
  setHasLoggedOut: (val: boolean) => void;
  loginWithGoogle: (tokenOrPayload?: any) => Promise<any>;
  saveSession: (token: string, profile: Partial<StudentProfile>) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userToken: null,
  studentUser: null,
  hasLoggedOut: false,
  setHasLoggedOut: () => {},
  loginWithGoogle: async () => {},
  saveSession: async () => {},
  logout: async () => {},
  restoreSession: async () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [studentUser, setStudentUser] = useState<Partial<StudentProfile> | null>(null);
  const [hasLoggedOut, setHasLoggedOut] = useState<boolean>(false);

  const restoreSession = async (): Promise<boolean> => {
    try {
      console.log('[Auth] Checking saved session at startup...');
      const savedToken = await storage.getAuthToken();
      const savedProfile = await storage.getStudentSession();

      if (savedToken) {
        setUserToken(savedToken);
        setAuthToken(savedToken);
        if (savedProfile) {
          setStudentUser(savedProfile);
        }
        setIsAuthenticated(true);
        console.log(`[Auth] Active session found for user: ${savedProfile?.fullName || savedProfile?.email || 'Student'}`);
        if (savedProfile) {
          console.log('[Auth Session Data]', JSON.stringify(savedProfile, null, 2));
        }
        return true;
      }
      console.log('[Auth] No saved session found at startup.');
      setIsAuthenticated(false);
      return false;
    } catch (err: any) {
      console.error('[Auth Error] Error restoring session:', err?.message || err);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const saveSession = async (token: string, profile: Partial<StudentProfile>) => {
    try {
      console.log(`[Auth] Persisting session to storage for: ${profile?.fullName || profile?.email || 'Student'}`);
      console.log('[Auth Session Data]', JSON.stringify(profile, null, 2));
      await storage.setAuthToken(token);
      await storage.setStudentSession(profile);
      setAuthToken(token);
      setUserToken(token);
      setStudentUser(profile);
      setHasLoggedOut(false);
      setIsAuthenticated(true);
      console.log(`[Auth] Session successfully persisted for: ${profile?.fullName || profile?.email || 'Student'}`);
    } catch (err: any) {
      console.error('[Auth Error] Failed to persist session:', err?.message || err);
    }
  };

  const loginWithGoogle = async (tokenOrPayload?: any) => {
    const authResult = await api.auth.loginWithGoogle(tokenOrPayload);
    if (authResult?.accessToken) {
      const token = authResult.accessToken;
      const profileData: Partial<StudentProfile> = {
        studentId: authResult.studentId || authResult.user?.studentId,
        userId: authResult.userId || authResult.user?.userId,
        schoolId: authResult.schoolId || authResult.user?.schoolId,
        fullName: authResult.user?.fullName || 'Student',
        email: authResult.user?.email || 'student@learn.kreativaglobal.sch.id',
        role: authResult.user?.role || 'student',
      };

      // Persist token and session to local storage
      await saveSession(token, profileData);
      return authResult;
    }
    throw new Error('Failed to retrieve authentication token.');
  };

  const logout = async () => {
    try {
      await fetch('https://learn.kreativaglobal.sch.id/api/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Ignore background logout network errors
    }
    await storage.clearAllSession();
    setAuthToken(null);
    setUserToken(null);
    setStudentUser(null);
    setHasLoggedOut(true);
    setIsAuthenticated(false);
    console.log('[Auth] User logged out successfully. Session cleared.');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userToken,
        studentUser,
        hasLoggedOut,
        setHasLoggedOut,
        loginWithGoogle,
        saveSession,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
