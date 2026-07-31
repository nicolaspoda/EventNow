import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="relative mt-16 border-t border-neutral-200 dark:border-neutral-800 py-6">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-neutral-500 dark:text-neutral-400">
        <p>&copy; {new Date().getFullYear()} EventNow</p>
        <Link
          to="/contact"
          className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          Nous contacter
        </Link>
      </div>
    </footer>
  );
}
