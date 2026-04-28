import { lazy, Suspense, useState, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { Layout } from '@/pages/Layout';
import { NotFoundPage } from '@/pages/NotFoundPage';

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
const SchlaglochPage = lazy(() => import('@/games/schlagloch/SchlaglochPage').then(m => ({ default: m.SchlaglochPage })));
const ProfilPage = lazy(() => import('@/pages/ProfilPage').then(m => ({ default: m.ProfilPage })));
const ArchivPage = lazy(() => import('@/pages/ArchivPage').then(m => ({ default: m.ArchivPage })));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminVerbindige = lazy(() => import('@/pages/admin/AdminVerbindige').then(m => ({ default: m.AdminVerbindige })));
const AdminZaemesetzli = lazy(() => import('@/pages/admin/AdminZaemesetzli').then(m => ({ default: m.AdminZaemesetzli })));
const AdminSchlagloch = lazy(() => import('@/pages/admin/AdminSchlagloch').then(m => ({ default: m.AdminSchlagloch })));
const AdminVerbindigeEditions = lazy(() => import('@/pages/admin/AdminVerbindigeEditions').then(m => ({ default: m.AdminVerbindigeEditions })));
const VerbindigeEditionPage = lazy(() => import('@/games/verbindige/VerbindigeEditionPage').then(m => ({ default: m.VerbindigeEditionPage })));

function ChunkLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--color-cyan)] border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DeferredUserAuth>
      <BrowserRouter>
        <Suspense fallback={<ChunkLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<LandingPage />} />
              <Route path="verbindige" element={<VerbindigePage />} />
              <Route path="verbindige/edition/:slug" element={<VerbindigeEditionPage />} />
              <Route path="zaemesetzli" element={<ZaemesetzliPage />} />
              <Route path="schlagloch" element={<SchlaglochPage />} />
              {/* Redirects from the old Schlagziil name so deep links don't 404. */}
              <Route path="schlagziil" element={<Navigate to="/schlagloch" replace />} />
              <Route path="profil" element={<ProfilPage />} />
              <Route path="archiv" element={<ArchivPage />} />
            </Route>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="verbindige" element={<AdminVerbindige />} />
              <Route path="zaemesetzli" element={<AdminZaemesetzli />} />
              <Route path="schlagloch" element={<AdminSchlagloch />} />
              <Route path="schlagziil" element={<Navigate to="/admin/schlagloch" replace />} />
              <Route path="verbindige-editions" element={<AdminVerbindigeEditions />} />
            </Route>
            <Route element={<Layout />}>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      </DeferredUserAuth>
    </AuthProvider>
  );
}
