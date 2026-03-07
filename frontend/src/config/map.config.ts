export const MAP_CONFIG = {
  defaultCenter: {
    lat: 46.603354,
    lng: 1.888334,
  } as const,
  defaultZoom: 6,
  maxZoom: 18,
  minZoom: 3,
  tileLayer: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  marker: {
    iconSize: [25, 41] as [number, number],
    iconAnchor: [12, 41] as [number, number],
    popupAnchor: [1, -34] as [number, number],
    shadowSize: [41, 41] as [number, number],
  },
  popup: {
    maxWidth: 300,
    minWidth: 200,
  },
  bounds: {
    padding: [50, 50] as [number, number],
  },
} as const;

export const GEOCODING_CONFIG = {
  apiUrl: 'https://api-adresse.data.gouv.fr',
  minQueryLength: 3,
  maxSuggestions: 5,
  debounceMs: 300,
} as const;
