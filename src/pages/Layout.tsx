import { Outlet, Link, useLocation } from 'react-router-dom';
import { ToastContainer } from '@/components/shared/Toast';

const NAV_ITEMS = [
  { path: '/', label: 'Spiele' },
  { path: '/verbindige', label: 'Verbindige' },
  { path: '/zaemesetzli', label: 'Zämesetzli' },
  { path: '/schlagziil', label: 'Schlagziil' },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white">
      {/* Watson-style nav */}
      <header className="sticky top-0 z-40 bg-[var(--color-nav-bg)]">
        <div className="mx-auto flex h-[56px] max-w-[1026px] items-center px-4">
          <Link to="/" className="mr-6 flex items-center gap-2">
            <span className="text-lg font-bold text-[var(--color-cyan)]">watson</span>
            <span className="rounded bg-[var(--color-pink)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
              Spiele
            </span>
          </Link>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`whitespace-nowrap rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
                  location.pathname === item.path
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="pb-12">
        <Outlet />
      </main>

      {/* Toast overlay */}
      <ToastContainer />

      {/* Footer */}
      <footer className="border-t border-[var(--color-gray-bg)] py-6 text-center text-xs text-[var(--color-gray-text)]">
        watson Spiele &middot; Spiel, aber deep. &middot; watson.ch
      </footer>
    </div>
  );
}
