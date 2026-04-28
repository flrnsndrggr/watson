import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import { UserAuthContext, type UserAuthState } from './userAuthContext';
import { reconcileStreaksOnLogin } from './streaks';
import { reconcileAchievementsOnLogin } from './achievements';
import { linkPushSubscriptionOnLogin } from './push';

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
      if (session?.user) {
        void reconcileStreaksOnLogin(session.user.id);
        void reconcileAchievementsOnLogin(session.user.id);
        void linkPushSubscriptionOnLogin();
      }
    });

    // Listen for auth changes (magic link callback, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ user: session?.user ?? null, session, loading: false });
      // Reconcile on fresh sign-in (not on token refresh)
      if (event === 'SIGNED_IN' && session?.user) {
        void reconcileStreaksOnLogin(session.user.id);
        void reconcileAchievementsOnLogin(session.user.id);
        void linkPushSubscriptionOnLogin();
      }
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
