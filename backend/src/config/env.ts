import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Load backend/.env regardless of cwd or whether we run from src/ or dist/src/.
const envCandidates = [
  path.resolve(__dirname, '../../.env'), // src/config -> backend/.env
  path.resolve(__dirname, '../../../.env'), // dist/src/config -> backend/.env
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
];
const envPath = envCandidates.find((p) => fs.existsSync(p));
if (envPath) dotenv.config({ path: envPath });
else dotenv.config();

const bool = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : v === 'true' || v === '1'));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().optional().default(''),

  DATABASE_URL: z.string().default(''),
  DIRECT_URL: z.string().optional().default(''),

  SESSION_SECRET: z.string().min(16).default('dev-only-insecure-secret-change-me'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

  BOOTSTRAP_ADMIN_EMAIL: z.string().default('admin@sail.local'),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().optional().default(''),
  BOOTSTRAP_ADMIN_NAME: z.string().default('Super Admin'),

  WEATHER_PROVIDER: z.enum(['open-meteo', 'openweathermap']).default('open-meteo'),
  WEATHER_API_KEY: z.string().optional().default(''),
  WEATHER_UNITS: z.enum(['metric', 'imperial']).default('metric'),
  WEATHER_CACHE_TTL_SECONDS: z.coerce.number().default(900),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: bool(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('SAIL <no-reply@sail.local>'),
  CONTACT_NOTIFY_EMAIL: z.string().optional().default(''),

  STORAGE_PROVIDER: z.enum(['local', 'supabase']).default('local'),
  UPLOAD_DIR: z.string().default('uploads'),
  UPLOAD_MAX_MB: z.coerce.number().default(8),
  PUBLIC_API_URL: z.string().default('http://localhost:4000'),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  SUPABASE_STORAGE_BUCKET: z.string().default('sail-media'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast with a readable message
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isDev: raw.NODE_ENV !== 'production',
  corsOrigins: [raw.FRONTEND_URL, ...raw.CORS_ORIGINS.split(',').map((s) => s.trim())].filter(Boolean),
  hasDatabase: raw.DATABASE_URL.startsWith('postgres'),
  hasWeatherKey: raw.WEATHER_API_KEY.length > 0,
  hasSmtp: raw.SMTP_HOST.length > 0,
};

export type Env = typeof env;
