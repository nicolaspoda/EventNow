import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import type { SearchUserResult } from '../../types/auth';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 1;

interface UserSearchAutocompleteProps {
  placeholder?: string;
  onSelect?: (user: SearchUserResult) => void;
  /** Si true, la sélection navigue vers le profil. Sinon on appelle onSelect uniquement. */
  navigateOnSelect?: boolean;
  /** IDs à exclure des suggestions (ex: membres déjà dans la conversation). */
  excludeIds?: string[];
  className?: string;
  inputClassName?: string;
}

export function UserSearchAutocomplete({
  placeholder = 'Rechercher un utilisateur...',
  onSelect,
  navigateOnSelect = true,
  excludeIds = [],
  className = '',
  inputClassName = '',
}: UserSearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchUserResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const stableExcludeIds = useMemo(() => excludeIds, [excludeIds.join(',')]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await authService.searchUsersByUsername(query, 15);
        const filtered = stableExcludeIds.length
          ? results.filter((u) => !stableExcludeIds.includes(u.id))
          : results;
        setSuggestions(filtered);
        setIsOpen(filtered.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query, stableExcludeIds]);

  const handleSelect = (user: SearchUserResult) => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onSelect?.(user);
    if (navigateOnSelect && user.id) {
      navigate(`/user/${user.id}/profile`);
    }
  };

  const displayName = (u: SearchUserResult) =>
    [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || '—';

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= MIN_QUERY_LENGTH && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          role="combobox"
          className={`w-full px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${inputClassName}`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-72 overflow-auto"
          role="listbox"
        >
          {suggestions.map((user) => (
            <li key={user.id} role="option">
              <button
                type="button"
                onClick={() => handleSelect(user)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:bg-neutral-50 dark:focus:bg-neutral-700 focus:outline-none transition-colors text-left"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {(user.username ?? user.firstName ?? '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900 dark:text-white truncate">
                    @{user.username ?? '—'}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                    {displayName(user)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
