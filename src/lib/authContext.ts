import { createContext, useContext } from 'react';

export interface AdminAuthState {
  user: { email?: string } | null;
  isAdmin: boolean;
  loading: boolean;
}

export interface AdminAuthContextValue extends AdminAuthState {
  signOut: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const DEFAULT_AUTH: AdminAuthContextValue = {
  user: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
};

export function useAuth(): AdminAuthContextValue {
  return useContext(AdminAuthContext) ?? DEFAULT_AUTH;
}
