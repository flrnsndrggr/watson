import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const VALID_CREDENTIALS = { username: 'admin', password: 'letsplayagame' };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const stored = sessionStorage.getItem('watson-auth');
    return stored ? JSON.parse(stored) : { isLoggedIn: false, username: null };
  });

  const login = useCallback((username: string, password: string) => {
    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      const state = { isLoggedIn: true, username };
      setAuth(state);
      sessionStorage.setItem('watson-auth', JSON.stringify(state));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setAuth({ isLoggedIn: false, username: null });
    sessionStorage.removeItem('watson-auth');
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
