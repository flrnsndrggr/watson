import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-4"
      style={{
        minHeight: '60vh',
        fontFamily: 'var(--font-body)',
        maxWidth: 'var(--game-max-width)',
        margin: '0 auto',
      }}
    >
      <span className="text-6xl mb-4" role="img" aria-label="Confused face">
        🤔
      </span>
      <h1
        className="text-3xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-cyan)' }}
      >
        404
      </h1>
      <p className="text-lg mb-6" style={{ color: 'var(--color-text-secondary)' }}>
        Da isch nüt. Die Siite gits nöd.
      </p>
      <Link
        to="/"
        className="inline-block font-semibold rounded-lg transition-opacity hover:opacity-80"
        style={{
          backgroundColor: 'var(--color-cyan)',
          color: 'var(--color-nav-bg)',
          padding: 'var(--space-sm) var(--space-lg)',
          fontSize: '1rem',
        }}
      >
        Zrugg zur Startsiite
      </Link>
    </div>
  );
}
