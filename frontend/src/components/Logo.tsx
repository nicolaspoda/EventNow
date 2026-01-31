import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'auth' | 'nav';
  showText?: boolean;
}

export function Logo({ variant = 'auth', showText = true }: LogoProps) {
  const isAuth = variant === 'auth';
  const size = isAuth ? 'w-16 h-16' : 'w-10 h-10';
  const iconSize = isAuth ? 'w-10 h-10' : 'w-6 h-6';

  const content = (
    <>
      <div
        className={`inline-flex items-center justify-center bg-purple-600 rounded-2xl ${size}`}
      >
        <svg
          className={`text-white ${iconSize}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
        </svg>
      </div>
      {showText &&
        (isAuth ? (
          <h1 className="text-4xl font-bold text-white mb-2 mt-4">EventNow</h1>
        ) : (
          <span className="ml-3 text-xl font-bold text-gray-900">EventNow</span>
        ))}
    </>
  );

  if (variant === 'nav') {
    return (
      <Link to="/dashboard" className="flex items-center">
        {content}
      </Link>
    );
  }

  return <div className="text-center">{content}</div>;
}
