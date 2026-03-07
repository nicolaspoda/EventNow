export interface AddressSuggestion {
  label: string;
  name: string;
  city: string;
  postcode: string;
  context: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export interface GeocodingResponse {
  type: string;
  version: string;
  features: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: [number, number];
    };
    properties: {
      label: string;
      score: number;
      housenumber?: string;
      id: string;
      name: string;
      postcode: string;
      citycode: string;
      x: number;
      y: number;
      city: string;
      context: string;
      type: string;
      importance: number;
      street?: string;
    };
  }>;
  attribution: string;
  licence: string;
  query: string;
  limit: number;
}

import { GEOCODING_CONFIG } from '../config/map.config';

class GeocodingService {
  private readonly baseUrl = GEOCODING_CONFIG.apiUrl;

  async searchAddress(query: string): Promise<AddressSuggestion[]> {
    if (!query || query.trim().length < GEOCODING_CONFIG.minQueryLength) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/search/?q=${encodeURIComponent(query)}&limit=${GEOCODING_CONFIG.maxSuggestions}`,
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche d\'adresse');
      }

      const data: GeocodingResponse = await response.json();

      return data.features.map((feature) => ({
        label: feature.properties.label,
        name: feature.properties.name,
        city: feature.properties.city,
        postcode: feature.properties.postcode,
        context: feature.properties.context,
        coordinates: {
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
        },
      }));
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      return [];
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<AddressSuggestion | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reverse/?lon=${lon}&lat=${lat}`,
      );

      if (!response.ok) {
        throw new Error('Erreur lors du géocodage inverse');
      }

      const data: GeocodingResponse = await response.json();

      if (data.features.length === 0) {
        return null;
      }

      const feature = data.features[0];
      return {
        label: feature.properties.label,
        name: feature.properties.name,
        city: feature.properties.city,
        postcode: feature.properties.postcode,
        context: feature.properties.context,
        coordinates: {
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
        },
      };
    } catch (error) {
      console.error('Erreur de géocodage inverse:', error);
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();
