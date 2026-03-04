import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'auth' | 'nav';
  showText?: boolean;
}

export function Logo({ variant = 'auth', showText = true }: LogoProps) {
  const isAuth = variant === 'auth';
  const containerSize = isAuth ? 'w-16 h-16' : 'w-10 h-10';
  const iconSize = isAuth ? 'w-9 h-9' : 'w-6 h-6';

  const icon = (
    <div
      className={`inline-flex items-center justify-center bg-gradient-to-br from-primary-600 to-accent-500 rounded-2xl shadow-glow ${containerSize}`}
    >
      <svg
        className={`text-white ${iconSize}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
        />
      </svg>
    </div>
  );

  if (variant === 'nav') {
    return (
      <Link to="/events" className="flex items-center gap-3 group" aria-label="EventNow — Accueil">
        <div className="group-hover:scale-105 transition-transform duration-200">{icon}</div>
        {showText && (
          <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
            EventNow
          </span>
        )}
      </Link>
    );
  }

  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      {showText && (
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent mt-2">
          EventNow
        </h1>
      )}
    </div>
  );
}
