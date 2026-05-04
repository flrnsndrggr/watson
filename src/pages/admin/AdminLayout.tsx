import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';

const ADMIN_NAV = [
  { path: '/admin', label: 'Dashboard', end: true },
  { path: '/admin/schedule', label: 'Schedule' },
  { path: '/admin/verbindige', label: 'Verbindige' },
  { path: '/admin/zaemesetzli', label: 'Zaemesetzli' },
  { path: '/admin/schlagloch', label: 'Schlagloch' },
  { path: '/admin/quizzhuber', label: 'Quizz den Huber' },
  { path: '/admin/aufgedeckt', label: 'Aufgedeckt' },
  { path: '/admin/quizzticle', label: 'Quizzticle' },
  { path: '/admin/verbindige-editions', label: 'Editions' },
];

export function AdminLayout() {
  const { isAdmin, loading, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // While the lazy auth provider mounts and getSession() resolves, hold off on
  // rendering admin chrome AND on redirecting — otherwise a logged-in admin
  // who deep-links to /admin would briefly see a redirect to "/" before the
  // session resolves.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--color-cyan)] border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Admin header */}
      <header className="sticky top-0 z-40 bg-[var(--color-nav-bg)] border-b border-white/10">
        <div className="mx-auto flex h-[56px] max-w-[1200px] items-center px-4">
          <Link to="/admin" className="mr-6 flex items-center gap-2">
            <span className="text-lg font-bold text-[var(--color-cyan)]">watson</span>
            <span className="rounded bg-[var(--color-blue)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
              Admin
            </span>
          </Link>
          <nav className="flex gap-1 overflow-x-auto">
            {ADMIN_NAV.map((item) => {
              const isActive = item.end
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`whitespace-nowrap rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-white/50">{user?.email}</span>
            <Link
              to="/"
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              Zur Seite
            </Link>
            <button
              onClick={async () => {
                await signOut();
                navigate('/', { replace: true });
              }}
              className="rounded bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[1200px] px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
