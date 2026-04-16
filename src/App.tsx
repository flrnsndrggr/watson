import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { Layout } from '@/pages/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { VerbindigePage } from '@/games/verbindige/VerbindigePage';
import { ZaemesetzliPage } from '@/games/zaemesetzli/ZaemesetzliPage';
import { SchlagziilPage } from '@/games/schlagziil/SchlagziilPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminVerbindige } from '@/pages/admin/AdminVerbindige';
import { AdminZaemesetzli } from '@/pages/admin/AdminZaemesetzli';
import { AdminSchlagziil } from '@/pages/admin/AdminSchlagziil';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="verbindige" element={<VerbindigePage />} />
            <Route path="zaemesetzli" element={<ZaemesetzliPage />} />
            <Route path="schlagziil" element={<SchlagziilPage />} />
          </Route>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="verbindige" element={<AdminVerbindige />} />
            <Route path="zaemesetzli" element={<AdminZaemesetzli />} />
            <Route path="schlagziil" element={<AdminSchlagziil />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
