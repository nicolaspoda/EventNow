import { useState, useRef, useEffect } from 'react';

export function AboutButton() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="À propos d'EventNow"
        aria-expanded={open}
        className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
      >
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="À propos d'EventNow"
          className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-4 z-50"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 flex-shrink-0 inline-flex items-center justify-center bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              EventNow
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Version</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
              v1.0
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
