import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { AdminAuthContext, type AdminAuthState } from './authContext';

export { useAuth } from './authContext';

// Admin status is derived from `app_metadata.role === 'admin'`. `app_metadata`
// is only writable with the service role key, so a regular user cannot grant
// themselves admin from the client.
function deriveIsAdmin(user: { app_metadata?: Record<string, unknown> } | null): boolean {
  return user?.app_metadata?.role === 'admin';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setState({ user, isAdmin: deriveIsAdmin(user), loading: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setState({ user, isAdmin: deriveIsAdmin(user), loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AdminAuthContext.Provider value={{ ...state, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
