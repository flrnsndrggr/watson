import { lazy, Suspense, useState, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { Layout } from '@/pages/Layout';

// Lazy-load UserAuthProvider so the Supabase SDK (~50KB gzip) is deferred
// from the critical rendering path. Auth resolves asynchronously anyway.
const LazyUserAuthModule = import('@/lib/userAuth');

function DeferredUserAuth({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<React.ComponentType<{ children: ReactNode }> | null>(null);

  useEffect(() => {
    LazyUserAuthModule.then((m) => setProvider(() => m.UserAuthProvider));
  }, []);

  if (!Provider) return <>{children}</>;
  return <Provider>{children}</Provider>;
}

const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const VerbindigePage = lazy(() => import('@/games/verbindige/VerbindigePage').then(m => ({ default: m.VerbindigePage })));
const ZaemesetzliPage = lazy(() => import('@/games/zaemesetzli/ZaemesetzliPage').then(m => ({ default: m.ZaemesetzliPage })));
const SchlagziilPage = lazy(() => import('@/games/schlagziil/SchlagziilPage').then(m => ({ default: m.SchlagziilPage })));
const BuchstaebliPage = lazy(() => import('@/games/buchstaebli/BuchstaebliPage').then(m => ({ default: m.BuchstaebliPage })));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminVerbindige = lazy(() => import('@/pages/admin/AdminVerbindige').then(m => ({ default: m.AdminVerbindige })));
const AdminZaemesetzli = lazy(() => import('@/pages/admin/AdminZaemesetzli').then(m => ({ default: m.AdminZaemesetzli })));
const AdminSchlagziil = lazy(() => import('@/pages/admin/AdminSchlagziil').then(m => ({ default: m.AdminSchlagziil })));

export default function App() {
  return (
    <AuthProvider>
      <DeferredUserAuth>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<LandingPage />} />
              <Route path="verbindige" element={<VerbindigePage />} />
              <Route path="zaemesetzli" element={<ZaemesetzliPage />} />
              <Route path="schlagziil" element={<SchlagziilPage />} />
              <Route path="buchstaebli" element={<BuchstaebliPage />} />
            </Route>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="verbindige" element={<AdminVerbindige />} />
              <Route path="zaemesetzli" element={<AdminZaemesetzli />} />
              <Route path="schlagziil" element={<AdminSchlagziil />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      </DeferredUserAuth>
    </AuthProvider>
  );
}
