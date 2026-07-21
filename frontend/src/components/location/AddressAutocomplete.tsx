import { useState, useEffect, useRef, useId } from 'react';
import { geocodingService, type AddressSuggestion } from '../../services/geocodingService';
import { GEOCODING_CONFIG } from '../../config/map.config';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: AddressSuggestion) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  compact?: boolean;
  id?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  label = 'Adresse',
  placeholder = 'Commencez à taper une adresse...',
  required = false,
  error,
  compact = false,
  id: idProp,
}: AddressAutocompleteProps) {
  const generatedId = useId();
  const inputId = idProp ?? `address-autocomplete-${generatedId.replace(/:/g, '')}`;
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const searchAddress = async () => {
      if (value.length < GEOCODING_CONFIG.minQueryLength) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await geocodingService.searchAddress(value);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error('Erreur de recherche d\'adresse:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchAddress, GEOCODING_CONFIG.debounceMs);
    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.label);
    onAddressSelect(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (e.target.value.length >= 3) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label
        htmlFor={inputId}
        className={`block text-sm font-medium text-neutral-700 dark:text-neutral-300 ${compact ? 'mb-1' : 'mb-2'}`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 rounded-xl border ${compact ? 'py-2' : 'py-3'} ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-neutral-300 dark:border-neutral-600 focus:ring-primary-500'
          } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors`}
          autoComplete="street-address"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:bg-neutral-50 dark:focus:bg-neutral-700 focus:outline-none transition-colors"
              >
                <div className="font-medium text-neutral-900 dark:text-neutral-100">
                  {suggestion.name}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {suggestion.city} {suggestion.postcode}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-500">
                  {suggestion.context}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
