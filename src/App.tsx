import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/pages/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { VerbindigePage } from '@/games/verbindige/VerbindigePage';
import { ZaemesetzliPage } from '@/games/zaemesetzli/ZaemesetzliPage';
import { SchlagziilPage } from '@/games/schlagziil/SchlagziilPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="verbindige" element={<VerbindigePage />} />
          <Route path="zaemesetzli" element={<ZaemesetzliPage />} />
          <Route path="schlagziil" element={<SchlagziilPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
