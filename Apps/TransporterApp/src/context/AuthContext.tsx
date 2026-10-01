import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  getSession,
  setSession,
  clearSession,
  SessionUser,
} from '../services/storage';
import { apiFetch, setOnSessionExpired } from '../services/api';
import { disconnectSocket } from '../services/socket';

type LoginData = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
};

type AuthContextValue = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  bootstrapping: boolean;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: SessionUser) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    getSession().then(session => {
      setUser(session.accessToken ? session.user : null);
      setBootstrapping(false);
    });

    setOnSessionExpired(() => setUser(null));
    return () => setOnSessionExpired(null);
  }, []);

  const login = useCallback(async (data: LoginData) => {
    await setSession(data);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore — clear local session regardless
    }
    disconnectSocket();
    await clearSession();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (nextUser: SessionUser) => {
    const session = await getSession();
    if (!session.accessToken || !session.refreshToken) return;
    await setSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: nextUser,
    });
    setUser(nextUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        bootstrapping,
        login,
        logout,
        updateUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
