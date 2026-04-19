import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import { UserAuthContext, type UserAuthState } from './userAuthContext';

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserAuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    // Listen for auth changes (magic link callback, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <UserAuthContext.Provider
      value={{ ...state, signInWithMagicLink, signOut }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}
