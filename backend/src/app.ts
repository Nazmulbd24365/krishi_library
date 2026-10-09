import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes';
import { env } from './config/env';
import { uploadRoot } from './services/storage.service';
import { errorHandler, notFoundHandler } from './middleware/error';
import { apiLimiter } from './middleware/rate-limit';
import { attachUser, verifyOrigin } from './middleware/auth';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (env.isDev) app.use(morgan('dev'));

  // Local media
  app.use(
    '/uploads',
    express.static(uploadRoot, {
      maxAge: '7d',
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    }),
  );

  app.get('/api/v1/health', (_req, res) => {
    res.json({ success: true, status: 'ok', env: env.NODE_ENV, time: new Date().toISOString() });
  });

  app.get('/api/v1/config/public', (_req, res) => {
    res.json({
      success: true,
      data: {
        weatherProvider: env.WEATHER_PROVIDER,
        weatherUnits: env.WEATHER_UNITS,
        emailEnabled: env.hasSmtp,
        maxUploadMb: env.UPLOAD_MAX_MB,
      },
    });
  });

  // OpenAPI document (hand-maintained, see docs/API.md).
  // Resolve it for both layouts: `src/` in dev and `dist/src/` after a build.
  const openapiCandidates = [
    path.resolve(__dirname, '../openapi.json'),
    path.resolve(__dirname, '../../openapi.json'),
    path.resolve(process.cwd(), 'openapi.json'),
  ];
  const openapiFile = openapiCandidates.find((p) => fs.existsSync(p));
  app.get('/api/v1/openapi.json', (_req, res) => {
    if (!openapiFile) return res.status(404).json({ success: false, message: 'OpenAPI document not found' });
    return res.sendFile(openapiFile);
  });

  app.use('/api/v1', apiLimiter, attachUser, verifyOrigin(env.corsOrigins), apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
