import React, { useState, useEffect, useRef } from 'react';
import { eventService } from '../../services/eventService';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

interface Suggestion {
  id: string;
  label: string;
  sublabel: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 2) {
      void fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, []);

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const fetchSuggestions = async (query: string) => {
    try {
      const data = await eventService.getSuggestions(query);
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Erreur suggestions:', error);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={handleInputBlur}
          placeholder="Rechercher un événement, lieu, artiste..."
          className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none"
          aria-label="Rechercher un événement"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => {
                onChange(suggestion.label);
                setShowSuggestions(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600 last:border-b-0 focus:outline-none focus:bg-neutral-50 dark:focus:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            >
              <div className="font-medium">{suggestion.label}</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">{suggestion.sublabel}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
