import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from '@/components/shared/Toast';
import { useAuth } from '@/lib/auth';

const NAV_ITEMS = [
  { path: '/', label: 'Spiele' },
  { path: '/verbindige', label: 'Verbindige' },
  { path: '/zaemesetzli', label: 'Zämesetzli' },
  { path: '/buchstaebli', label: 'Buchstäbli' },
  { path: '/schlagziil', label: 'Schlagziil' },
];

function LoginModal({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      onClose();
      navigate('/admin');
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Benutzer</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(false); }}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-cyan)] focus:outline-none focus:ring-1 focus:ring-[var(--color-cyan)]"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-cyan)] focus:outline-none focus:ring-1 focus:ring-[var(--color-cyan)]"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">Ungueltige Anmeldedaten</p>
          )}
          <button
            type="submit"
            className="w-full rounded bg-[var(--color-cyan)] py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

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
          <div className="ml-auto">
            {isLoggedIn ? (
              <Link
                to="/admin"
                className="rounded bg-[var(--color-blue)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
              >
                Admin
              </Link>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-12">
        <Outlet />
      </main>

      {/* Toast overlay */}
      <ToastContainer />

      {/* Login modal */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* Footer */}
      <footer className="border-t border-[var(--color-gray-bg)] py-6 text-center text-xs text-[var(--color-gray-text)]">
        watson Spiele &middot; Spiel, aber deep. &middot; watson.ch
      </footer>
    </div>
  );
}
