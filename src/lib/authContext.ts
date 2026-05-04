import { createContext, useContext } from 'react';

export interface AdminAuthState {
  user: { email?: string } | null;
  isAdmin: boolean;
  loading: boolean;
}

export interface AdminAuthContextValue extends AdminAuthState {
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const DEFAULT_AUTH: AdminAuthContextValue = {
  user: null,
  isAdmin: false,
  loading: true,
  signInWithPassword: async () => ({ error: 'Auth not loaded' }),
  signOut: async () => {},
};

export function useAuth(): AdminAuthContextValue {
  return useContext(AdminAuthContext) ?? DEFAULT_AUTH;
}
