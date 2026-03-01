import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (value.length >= 2) {
      void fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

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
    <div className="relative">
      <div className="relative">
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder="Rechercher un événement, lieu, artiste..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          aria-label="Rechercher un événement"
        />
        <div
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"
          aria-hidden="true"
        >
          🔍
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => {
                onChange(suggestion.label);
                setShowSuggestions(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 focus:outline-none focus:bg-gray-50"
            >
              <div className="font-medium">{suggestion.label}</div>
              <div className="text-sm text-gray-500">{suggestion.sublabel}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
