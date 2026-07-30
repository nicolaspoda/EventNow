import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geocodingService } from '../services/geocodingService';
import type { GeocodingResponse } from '../services/geocodingService';

function makeResponse(features: GeocodingResponse['features']): GeocodingResponse {
  return {
    type: 'FeatureCollection',
    version: 'draft',
    features,
    attribution: 'BAN',
    licence: 'ODbL',
    query: 'q',
    limit: 5,
  };
}

const feature: GeocodingResponse['features'][number] = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
  properties: {
    label: '10 Rue de Paris 75001 Paris',
    score: 0.9,
    id: '1',
    name: '10 Rue de Paris',
    postcode: '75001',
    citycode: '75101',
    x: 0,
    y: 0,
    city: 'Paris',
    context: '75, Paris, Île-de-France',
    type: 'housenumber',
    importance: 0.8,
  },
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('geocodingService.searchAddress', () => {
  it('returns an empty array without calling fetch when the query is too short', async () => {
    const result = await geocodingService.searchAddress('ab');

    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns an empty array for an empty query', async () => {
    const result = await geocodingService.searchAddress('');

    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fetches and maps suggestions for a valid query', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => makeResponse([feature]),
    } as Response);

    const result = await geocodingService.searchAddress('Paris');

    expect(fetch).toHaveBeenCalledWith(
      'https://api-adresse.data.gouv.fr/search/?q=Paris&limit=5',
    );
    expect(result).toEqual([
      {
        label: '10 Rue de Paris 75001 Paris',
        name: '10 Rue de Paris',
        city: 'Paris',
        postcode: '75001',
        context: '75, Paris, Île-de-France',
        coordinates: { lat: 48.8566, lon: 2.3522 },
      },
    ]);
  });

  it('returns an empty array when the response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    const result = await geocodingService.searchAddress('Paris');

    expect(result).toEqual([]);
  });

  it('returns an empty array when fetch rejects', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network error'));

    const result = await geocodingService.searchAddress('Paris');

    expect(result).toEqual([]);
  });
});

describe('geocodingService.reverseGeocode', () => {
  it('fetches and maps the first feature', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => makeResponse([feature]),
    } as Response);

    const result = await geocodingService.reverseGeocode(48.8566, 2.3522);

    expect(fetch).toHaveBeenCalledWith(
      'https://api-adresse.data.gouv.fr/reverse/?lon=2.3522&lat=48.8566',
    );
    expect(result).toEqual({
      label: '10 Rue de Paris 75001 Paris',
      name: '10 Rue de Paris',
      city: 'Paris',
      postcode: '75001',
      context: '75, Paris, Île-de-France',
      coordinates: { lat: 48.8566, lon: 2.3522 },
    });
  });

  it('returns null when there are no features', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => makeResponse([]),
    } as Response);

    const result = await geocodingService.reverseGeocode(0, 0);

    expect(result).toBeNull();
  });

  it('returns null when the response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    const result = await geocodingService.reverseGeocode(0, 0);

    expect(result).toBeNull();
  });

  it('returns null when fetch rejects', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network error'));

    const result = await geocodingService.reverseGeocode(0, 0);

    expect(result).toBeNull();
  });
});
