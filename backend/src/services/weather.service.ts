import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface Division {
  key: string;
  nameBn: string;
  nameEn: string;
  lat: number;
  lon: number;
}

/** The eight administrative divisions of Bangladesh. */
export const DIVISIONS: Division[] = [
  { key: 'dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka', lat: 23.8103, lon: 90.4125 },
  { key: 'chattogram', nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram', lat: 22.3569, lon: 91.7832 },
  { key: 'rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi', lat: 24.3745, lon: 88.6042 },
  { key: 'khulna', nameBn: 'খুলনা', nameEn: 'Khulna', lat: 22.8456, lon: 89.5403 },
  { key: 'barishal', nameBn: 'বরিশাল', nameEn: 'Barishal', lat: 22.701, lon: 90.3535 },
  { key: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet', lat: 24.8949, lon: 91.8687 },
  { key: 'rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur', lat: 25.7439, lon: 89.2752 },
  { key: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh', lat: 24.7471, lon: 90.4203 },
];

export interface WeatherResult {
  division: string;
  nameBn: string;
  nameEn: string;
  temperature: number | null;
  condition: string | null;
  conditionBn: string | null;
  icon: string;
  humidity: number | null;
  windSpeed: number | null;
  units: 'metric' | 'imperial';
  fetchedAt: string;
  ok: boolean;
  stale: boolean;
}

const CONDITION_BN: Record<string, string> = {
  clear: 'পরিষ্কার',
  'partly-cloudy': 'আংশিক মেঘলা',
  cloudy: 'মেঘলা',
  fog: 'কুয়াশা',
  drizzle: 'গুঁড়ি গুঁড়ি বৃষ্টি',
  rain: 'বৃষ্টি',
  snow: 'তুষার',
  thunderstorm: 'বজ্রঝড়',
  unknown: 'অজানা',
};

const WMO_MAP: Record<number, string> = {
  0: 'clear',
  1: 'clear',
  2: 'partly-cloudy',
  3: 'cloudy',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'drizzle',
  57: 'drizzle',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  66: 'rain',
  67: 'rain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  80: 'rain',
  81: 'rain',
  82: 'rain',
  85: 'snow',
  86: 'snow',
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};

function iconFor(condition: string): string {
  switch (condition) {
    case 'clear':
      return 'sun';
    case 'partly-cloudy':
      return 'cloud-sun';
    case 'cloudy':
      return 'cloud';
    case 'fog':
      return 'cloud-fog';
    case 'drizzle':
    case 'rain':
      return 'cloud-rain';
    case 'snow':
      return 'cloud-snow';
    case 'thunderstorm':
      return 'cloud-lightning';
    default:
      return 'cloud';
  }
}

interface Normalized {
  temperature: number | null;
  condition: string;
  humidity: number | null;
  windSpeed: number | null;
  raw: unknown;
}

async function fetchOpenMeteo(d: Division): Promise<Normalized> {
  const unitParam = env.WEATHER_UNITS === 'imperial' ? '&temperature_unit=fahrenheit&wind_speed_unit=mph' : '';
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${d.lat}&longitude=${d.lon}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code${unitParam}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  const json = (await res.json()) as { current?: Record<string, number> };
  const c = json.current ?? {};
  const code = Number(c.weather_code);
  const condition = WMO_MAP[code] ?? 'unknown';
  return {
    temperature: typeof c.temperature_2m === 'number' ? c.temperature_2m : null,
    condition,
    humidity: typeof c.relative_humidity_2m === 'number' ? c.relative_humidity_2m : null,
    windSpeed: typeof c.wind_speed_10m === 'number' ? c.wind_speed_10m : null,
    raw: json,
  };
}

async function fetchOpenWeatherMap(d: Division): Promise<Normalized> {
  if (!env.WEATHER_API_KEY) throw new Error('WEATHER_API_KEY is not set');
  const units = env.WEATHER_UNITS === 'imperial' ? 'imperial' : 'metric';
  const url =
    `https://api.openweathermap.org/data/2.5/weather?lat=${d.lat}&lon=${d.lon}` +
    `&appid=${env.WEATHER_API_KEY}&units=${units}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`OpenWeatherMap responded ${res.status}`);
  const json = (await res.json()) as {
    main?: { temp?: number; humidity?: number };
    wind?: { speed?: number };
    weather?: Array<{ main?: string }>;
  };
  const main = (json.weather?.[0]?.main ?? '').toLowerCase();
  let condition = 'unknown';
  if (main.includes('clear')) condition = 'clear';
  else if (main.includes('cloud')) condition = 'cloudy';
  else if (main.includes('rain') || main.includes('drizzle')) condition = 'rain';
  else if (main.includes('thunder')) condition = 'thunderstorm';
  else if (main.includes('snow')) condition = 'snow';
  else if (main.includes('mist') || main.includes('fog') || main.includes('haze')) condition = 'fog';
  return {
    temperature: json.main?.temp ?? null,
    condition,
    humidity: json.main?.humidity ?? null,
    windSpeed: json.wind?.speed ?? null,
    raw: json,
  };
}

async function fetchProvider(d: Division): Promise<Normalized> {
  return env.WEATHER_PROVIDER === 'openweathermap' ? fetchOpenWeatherMap(d) : fetchOpenMeteo(d);
}

function fallbackResult(d: Division, stale = false, from?: Partial<WeatherResult>): WeatherResult {
  return {
    division: d.key,
    nameBn: d.nameBn,
    nameEn: d.nameEn,
    temperature: from?.temperature ?? null,
    condition: from?.condition ?? null,
    conditionBn: from?.conditionBn ?? null,
    icon: from?.icon ?? 'cloud',
    humidity: from?.humidity ?? null,
    windSpeed: from?.windSpeed ?? null,
    units: env.WEATHER_UNITS,
    fetchedAt: from?.fetchedAt ?? new Date().toISOString(),
    ok: from?.ok ?? false,
    stale,
  };
}

function toResult(d: Division, n: Normalized, fetchedAt: Date): WeatherResult {
  return {
    division: d.key,
    nameBn: d.nameBn,
    nameEn: d.nameEn,
    temperature: n.temperature,
    condition: n.condition,
    conditionBn: CONDITION_BN[n.condition] ?? n.condition,
    icon: iconFor(n.condition),
    humidity: n.humidity,
    windSpeed: n.windSpeed,
    units: env.WEATHER_UNITS,
    fetchedAt: fetchedAt.toISOString(),
    ok: n.temperature !== null,
    stale: false,
  };
}

async function readCache(d: Division): Promise<WeatherResult | null> {
  try {
    const row = await prisma.weatherCache.findUnique({ where: { division: d.key } });
    if (!row) return null;
    const stale = row.expiresAt < new Date() || !row.ok;
    return {
      division: d.key,
      nameBn: d.nameBn,
      nameEn: d.nameEn,
      temperature: row.temperature,
      condition: row.condition,
      conditionBn: row.conditionBn,
      icon: row.icon ?? 'cloud',
      humidity: row.humidity,
      windSpeed: row.windSpeed,
      units: env.WEATHER_UNITS,
      fetchedAt: row.fetchedAt.toISOString(),
      ok: row.ok,
      stale,
    };
  } catch {
    return null;
  }
}

async function writeCache(d: Division, n: Normalized, fetchedAt: Date, ok: boolean) {
  const expiresAt = new Date(fetchedAt.getTime() + env.WEATHER_CACHE_TTL_SECONDS * 1000);
  const condition = n.condition;
  try {
    await prisma.weatherCache.upsert({
      where: { division: d.key },
      create: {
        division: d.key,
        provider: env.WEATHER_PROVIDER,
        temperature: n.temperature,
        condition,
        conditionBn: CONDITION_BN[condition] ?? condition,
        icon: iconFor(condition),
        humidity: n.humidity,
        windSpeed: n.windSpeed,
        payload: n.raw as object,
        ok,
        fetchedAt,
        expiresAt,
      },
      update: {
        provider: env.WEATHER_PROVIDER,
        temperature: n.temperature,
        condition,
        conditionBn: CONDITION_BN[condition] ?? condition,
        icon: iconFor(condition),
        humidity: n.humidity,
        windSpeed: n.windSpeed,
        payload: n.raw as object,
        ok,
        fetchedAt,
        expiresAt,
      },
    });
  } catch (err) {
    logger.warn({ err }, 'Could not persist weather cache');
  }
}

/** Get weather for one division, using cache when fresh and falling back safely. */
export async function getDivisionWeather(d: Division): Promise<WeatherResult> {
  const cached = await readCache(d);
  if (cached && !cached.stale) return cached;

  try {
    const n = await fetchProvider(d);
    const fetchedAt = new Date();
    await writeCache(d, n, fetchedAt, n.temperature !== null);
    return toResult(d, n, fetchedAt);
  } catch (err) {
    logger.warn({ err, division: d.key }, 'Weather fetch failed');
    if (cached) return { ...cached, stale: true };
    return fallbackResult(d, true);
  }
}

export async function getAllWeather(): Promise<WeatherResult[]> {
  return Promise.all(DIVISIONS.map((d) => getDivisionWeather(d)));
}

export function findDivision(key: string): Division | undefined {
  return DIVISIONS.find((d) => d.key === key.toLowerCase());
}
