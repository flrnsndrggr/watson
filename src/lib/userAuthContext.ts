import { createContext, useContext } from 'react';

export interface UserAuthState {
  user: { email?: string } | null;
  session: unknown;
  loading: boolean;
}

export interface UserAuthContextValue extends UserAuthState {
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const UserAuthContext = createContext<UserAuthContextValue | null>(null);

/** Default value returned while the auth provider is still loading. */
const DEFAULT_AUTH: UserAuthContextValue = {
  user: null,
  session: null,
  loading: true,
  signInWithMagicLink: async () => ({ error: 'Auth not loaded' }),
  signOut: async () => {},
};

export function useUserAuth(): UserAuthContextValue {
  return useContext(UserAuthContext) ?? DEFAULT_AUTH;
}
