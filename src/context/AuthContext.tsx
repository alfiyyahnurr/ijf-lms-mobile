import React, { createContext, useContext, useState, useEffect } from 'react';
import storage from '../services/storage';
import { api, setAuthToken } from '../services/api';
import { StudentProfile } from '../types';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userToken: string | null;
  studentUser: Partial<StudentProfile> | null;
  loginWithGoogle: (tokenOrPayload?: any) => Promise<any>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userToken: null,
  studentUser: null,
  loginWithGoogle: async () => {},
  logout: async () => {},
  restoreSession: async () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [studentUser, setStudentUser] = useState<Partial<StudentProfile> | null>(null);

  const restoreSession = async (): Promise<boolean> => {
    try {
      const savedToken = await storage.getAuthToken();
      const savedProfile = await storage.getStudentSession();

      if (savedToken) {
        setUserToken(savedToken);
        setAuthToken(savedToken);
        if (savedProfile) {
          setStudentUser(savedProfile);
        }
        setIsAuthenticated(true);
        return true;
      }
      setIsAuthenticated(false);
      return false;
    } catch {
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const loginWithGoogle = async (tokenOrPayload?: any) => {
    const authResult = await api.auth.loginWithGoogle(tokenOrPayload);
    if (authResult?.accessToken) {
      const token = authResult.accessToken;
      const profileData: Partial<StudentProfile> = {
        studentId: authResult.studentId || authResult.user?.studentId,
        userId: authResult.userId || authResult.user?.userId,
        schoolId: authResult.schoolId || authResult.user?.schoolId,
        fullName: authResult.user?.fullName || 'Fatih Alamsyah',
        email: authResult.user?.email || 'fatih.alamsyah@learn.kreativaglobal.sch.id',
        role: authResult.user?.role || 'student',
      };

      // Persist token and session to local storage
      await storage.setAuthToken(token);
      await storage.setStudentSession(profileData);
      setAuthToken(token);

      setUserToken(token);
      setStudentUser(profileData);
      setIsAuthenticated(true);
      return authResult;
    }
    throw new Error('Failed to retrieve authentication token.');
  };

  const logout = async () => {
    await storage.clearAllSession();
    setAuthToken(null);
    setUserToken(null);
    setStudentUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userToken,
        studentUser,
        loginWithGoogle,
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

