import { describe, expect, it } from 'vitest';
import {
  WEATHER_IMAGE_FORMATS,
  latestFetchedAt,
  normalizeWeatherDivisions,
  weatherImageFilename,
} from './weatherShareImage';
import type { WeatherEntry, WeatherResponse } from '@/types';

function entry(overrides: Partial<WeatherEntry> = {}): WeatherEntry {
  return {
    division: 'dhaka',
    nameBn: 'ঢাকা',
    nameEn: 'Dhaka',
    temperature: 31.4,
    condition: 'Partly cloudy',
    conditionBn: 'আংশিক মেঘলা',
    icon: 'cloud-sun',
    humidity: 72,
    windSpeed: 11.2,
    units: 'metric',
    fetchedAt: '2026-05-01T09:30:00.000Z',
    ok: true,
    stale: false,
    ...overrides,
  };
}

describe('weather image formats', () => {
  it('exposes the documented dimensions for each template', () => {
    expect(WEATHER_IMAGE_FORMATS.square).toMatchObject({ width: 1080, height: 1080 });
    expect(WEATHER_IMAGE_FORMATS.portrait).toMatchObject({ width: 1080, height: 1350 });
    expect(WEATHER_IMAGE_FORMATS.landscape).toMatchObject({ width: 1200, height: 630 });
  });

  it('builds a descriptive PNG filename including the size', () => {
    const now = new Date('2026-05-01T00:00:00.000Z');
    expect(weatherImageFilename('square', now)).toBe('sail-weather-square-1080x1080-2026-05-01.png');
    expect(weatherImageFilename('landscape', now)).toBe('sail-weather-landscape-1200x630-2026-05-01.png');
  });
});

describe('normalizeWeatherDivisions', () => {
  it('always returns the eight divisions in a stable order', () => {
    const weather: WeatherResponse = { provider: 'open-meteo', units: 'metric', divisions: [entry()] };
    const divisions = normalizeWeatherDivisions(weather);
    expect(divisions).toHaveLength(8);
    expect(divisions.map((division) => division.division)).toEqual([
      'dhaka',
      'chattogram',
      'rajshahi',
      'khulna',
      'barishal',
      'sylhet',
      'rangpur',
      'mymensingh',
    ]);
  });

  it('fills missing divisions with an explicit unavailable state instead of fake numbers', () => {
    const divisions = normalizeWeatherDivisions({ provider: 'open-meteo', units: 'metric', divisions: [] });
    expect(divisions).toHaveLength(8);
    for (const division of divisions) {
      expect(division.temperature).toBeNull();
      expect(division.humidity).toBeNull();
      expect(division.windSpeed).toBeNull();
      expect(division.ok).toBe(false);
      expect(division.nameBn).toBeTruthy();
      expect(division.nameEn).toBeTruthy();
    }
  });

  it('handles a null response without throwing', () => {
    expect(normalizeWeatherDivisions(null)).toHaveLength(8);
  });

  it('prefers real readings over the fallback entry', () => {
    const weather: WeatherResponse = {
      provider: 'open-meteo',
      units: 'metric',
      divisions: [entry({ division: 'sylhet', temperature: 28.6, humidity: null })],
    };
    const sylhet = normalizeWeatherDivisions(weather).find((division) => division.division === 'sylhet');
    expect(sylhet?.temperature).toBe(28.6);
    expect(sylhet?.humidity).toBeNull();
  });
});

describe('latestFetchedAt', () => {
  it('returns the newest valid timestamp', () => {
    const divisions = [
      entry({ fetchedAt: '2026-05-01T09:30:00.000Z' }),
      entry({ division: 'khulna', fetchedAt: '2026-05-01T09:45:00.000Z' }),
      entry({ division: 'sylhet', fetchedAt: '' }),
    ];
    expect(latestFetchedAt(divisions)).toBe('2026-05-01T09:45:00.000Z');
  });

  it('returns null when no timestamps are available', () => {
    expect(latestFetchedAt([entry({ fetchedAt: '' })])).toBeNull();
    expect(latestFetchedAt(normalizeWeatherDivisions(null))).toBeNull();
  });
});
