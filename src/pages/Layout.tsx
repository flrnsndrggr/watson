import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ToastContainer } from '@/components/shared/Toast';
import { AccountPromptHost } from '@/components/shared/AccountPromptHost';
import { AchievementCelebrationHost } from '@/components/shared/AchievementCelebration';
import { StreakMilestoneCelebrationHost } from '@/components/shared/StreakMilestoneCelebration';
import { useAuth } from '@/lib/authContext';
import { useUserAuth } from '@/lib/userAuthContext';
import { AuthModal } from '@/components/shared/AuthModal';

/**
 * Horizontally scrollable nav with gradient fade indicators on overflow edges.
 * Shows a right fade when more items are hidden, left fade when scrolled right.
 */
function NavScroller({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    const nav = scrollRef.current;
    if (!nav) return;

    function update() {
      if (!nav) return;
      const { scrollLeft, scrollWidth, clientWidth } = nav;
      setShowLeft(scrollLeft > 4);
      setShowRight(scrollLeft + clientWidth < scrollWidth - 4);
    }

    update();
    nav.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(nav);
    return () => {
      nav.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative min-w-0 flex-1">
      <nav
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {children}
      </nav>
      {/* Left fade */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[var(--color-nav-bg)] to-transparent transition-opacity duration-150 ${
          showLeft ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      />
      {/* Right fade */}
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[var(--color-nav-bg)] to-transparent transition-opacity duration-150 ${
          showRight ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      />
    </div>
  );
}

const NAV_ITEMS = [
  { path: '/', label: 'Spiele' },
  { path: '/verbindige', label: 'Verbindige' },
  { path: '/zaemesetzli', label: 'Zämesetzli' },
  { path: '/schlagloch', label: 'Schlagloch' },
  { path: '/quizzhuber', label: 'Quizz den Huber' },
  { path: '/aufgedeckt', label: 'Aufgedeckt' },
  { path: '/quizzticle', label: 'Quizzticle' },
];

export function Layout() {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { user, loading: userLoading, signOut } = useUserAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="min-h-screen bg-white">
      {/* Watson-style nav */}
      <header className="sticky top-0 z-40 bg-[var(--color-nav-bg)]">
        <div className="mx-auto flex h-[56px] max-w-[1026px] items-center px-4">
          <Link to="/" className="mr-6 flex items-baseline gap-1.5">
            {/* Wordmark mirrors watson.ch chrome: lowercase "watson" in white
                on black, with a magenta "spiele" suffix marking the sub-brand. */}
            <span className="font-[family-name:var(--font-heading)] text-xl font-black tracking-tight text-white">
              watson
            </span>
            <span className="font-[family-name:var(--font-heading)] text-xl font-black tracking-tight text-[var(--color-pink)]">
              spiele
            </span>
          </Link>
          <NavScroller>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex min-h-[44px] items-center whitespace-nowrap rounded px-3 text-sm font-semibold transition-colors ${
                  location.pathname === item.path
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </NavScroller>
          <div className="ml-auto flex items-center gap-2">
            {/* User account */}
            {!userLoading && (
              user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu((v) => !v)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-cyan)] text-xs font-bold text-white hover:opacity-85 transition-opacity cursor-pointer"
                    aria-label="Konto-Menü"
                  >
                    {userInitial}
                  </button>
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 top-10 z-50 w-56 rounded-lg bg-white py-2 shadow-lg ring-1 ring-black/5">
                        <div className="px-4 py-2 text-xs text-[var(--color-gray-text)] truncate">
                          {user.email}
                        </div>
                        <div className="mx-2 my-1 h-px bg-gray-100" />
                        <Link
                          to="/profil"
                          onClick={() => setShowUserMenu(false)}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Mein Profil
                        </Link>
                        <button
                          onClick={async () => {
                            await signOut();
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                          Abmelden
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="rounded bg-[var(--color-cyan)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
                  aria-label="Anmelden"
                >
                  Anmelden
                </button>
              )
            )}
            {/* Admin login */}
            {isAdmin && (
              <Link
                to="/admin"
                className="rounded bg-[var(--color-blue)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
              >
                Admin
              </Link>
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

      {/* Account-prompt host — listens to triggerAccountPrompt() events */}
      <AccountPromptHost />

      {/* Achievement celebration — listens to achievement-unlocked events */}
      <AchievementCelebrationHost />

      {/* Streak milestone celebration — full-screen overlay for 7/14/30/50/100/365 days */}
      <StreakMilestoneCelebrationHost />

      {/* Auth modal (magic link). Used for both player accounts and admins:
          admin status is granted server-side via app_metadata.role, so the
          login flow is identical — once the magic-link signs you in, the
          "Admin" link in the header appears automatically if you have the
          role. */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Footer */}
      <footer className="border-t border-[var(--color-gray-bg)] py-6 text-center text-xs text-[var(--color-gray-text)]">
        watson Spiele &middot; Spiel, aber deep. &middot; watson.ch
        {!isAdmin && !user && (
          <>
            {' '}&middot;{' '}
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-[var(--color-gray-text)] hover:text-[var(--color-cyan)] transition-colors cursor-pointer"
            >
              Admin
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
