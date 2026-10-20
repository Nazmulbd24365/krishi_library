import type { Lang } from '@/i18n';
import type { WeatherEntry, WeatherResponse } from '@/types';

export type WeatherShareFormat = 'square' | 'portrait' | 'landscape';

export const WEATHER_IMAGE_FORMATS: Record<
  WeatherShareFormat,
  { width: number; height: number; columns: number; rows: number }
> = {
  square: { width: 1080, height: 1080, columns: 2, rows: 4 },
  portrait: { width: 1080, height: 1350, columns: 2, rows: 4 },
  landscape: { width: 1200, height: 630, columns: 4, rows: 2 },
};

export interface WeatherImageCopy {
  title: string;
  subtitle: string;
  humidity: string;
  wind: string;
  updated: string;
  unavailable: string;
  footer: string;
}

export interface WeatherImageOptions {
  weather: WeatherResponse | null;
  lang: Lang;
  format: WeatherShareFormat;
  siteUrl: string;
  copy: WeatherImageCopy;
  now?: Date;
}

const DIVISION_META = [
  { key: 'dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka' },
  { key: 'chattogram', nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram' },
  { key: 'rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi' },
  { key: 'khulna', nameBn: 'খুলনা', nameEn: 'Khulna' },
  { key: 'barishal', nameBn: 'বরিশাল', nameEn: 'Barishal' },
  { key: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet' },
  { key: 'rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur' },
  { key: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh' },
] as const;

/** Always return the eight divisions in a stable order, filling gaps safely. */
export function normalizeWeatherDivisions(weather: WeatherResponse | null): WeatherEntry[] {
  const entries = new Map((weather?.divisions ?? []).map((division) => [division.division, division]));
  return DIVISION_META.map(
    (meta): WeatherEntry =>
      entries.get(meta.key) ?? {
        division: meta.key,
        nameBn: meta.nameBn,
        nameEn: meta.nameEn,
        temperature: null,
        condition: null,
        conditionBn: null,
        icon: 'cloud',
        humidity: null,
        windSpeed: null,
        units: weather?.units ?? 'metric',
        fetchedAt: '',
        ok: false,
        stale: false,
      },
  );
}

export function weatherImageFilename(format: WeatherShareFormat, now = new Date()): string {
  const stamp = now.toISOString().slice(0, 10);
  const { width, height } = WEATHER_IMAGE_FORMATS[format];
  return `sail-weather-${format}-${width}x${height}-${stamp}.png`;
}

/** Convert a rendered canvas to a PNG Blob. */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas could not be encoded as PNG'));
    }, 'image/png');
  });
}

export function latestFetchedAt(divisions: WeatherEntry[]): string | null {
  const times = divisions
    .map((division) => (division.fetchedAt ? Date.parse(division.fetchedAt) : Number.NaN))
    .filter((time) => Number.isFinite(time)) as number[];
  if (!times.length) return null;
  return new Date(Math.max(...times)).toISOString();
}

function resolveFont(lang: Lang, weight: number, size: number): string {
  const family =
    lang === 'bn'
      ? '"Hind Siliguri", "Noto Sans Bengali", sans-serif'
      : 'Inter, "Hind Siliguri", sans-serif';
  return `${weight} ${size}px ${family}`;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (!text || ctx.measureText(text).width <= maxWidth) return text;
  let value = text;
  while (value.length > 1 && ctx.measureText(`${value}…`).width > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value.trimEnd()}…`;
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(23, 61, 39, 0.18)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#1f5132';
  roundRectPath(ctx, x, y, size, size, size * 0.22);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 64, size / 64);
  ctx.strokeStyle = '#f4e4b8';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(32, 49);
  ctx.lineTo(32, 30);
  ctx.stroke();

  ctx.fillStyle = '#9ec58f';
  ctx.beginPath();
  ctx.ellipse(39, 26, 10, 6.8, -0.62, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d9b95c';
  ctx.beginPath();
  ctx.ellipse(25, 35, 9, 6, 0.66, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSun(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const radius = size * 0.27;
  ctx.strokeStyle = '#d9a93c';
  ctx.fillStyle = '#e2b74d';
  ctx.lineWidth = Math.max(1.5, size * 0.055);
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * radius * 1.45, cy + Math.sin(angle) * radius * 1.45);
    ctx.lineTo(cx + Math.cos(angle) * radius * 1.9, cy + Math.sin(angle) * radius * 1.9);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color = '#5f8f6a',
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx - size * 0.22, cy + size * 0.04, size * 0.21, 0, Math.PI * 2);
  ctx.arc(cx, cy - size * 0.13, size * 0.27, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.24, cy + size * 0.04, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  roundRectPath(ctx, cx - size * 0.4, cy + size * 0.02, size * 0.8, size * 0.23, size * 0.11);
  ctx.fill();
}

function drawWeatherIcon(
  ctx: CanvasRenderingContext2D,
  kind: string,
  cx: number,
  cy: number,
  size: number,
) {
  const icon = kind || 'cloud';
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (icon === 'sun') {
    drawSun(ctx, cx, cy, size);
  } else if (icon === 'cloud-sun') {
    drawSun(ctx, cx - size * 0.16, cy - size * 0.18, size * 0.72);
    drawCloud(ctx, cx + size * 0.06, cy + size * 0.1, size * 0.86);
  } else if (icon === 'cloud-rain') {
    drawCloud(ctx, cx, cy - size * 0.08, size, '#5f8f6a');
    ctx.strokeStyle = '#4d7fa8';
    ctx.lineWidth = Math.max(1.6, size * 0.055);
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * size * 0.22, cy + size * 0.26);
      ctx.lineTo(cx + i * size * 0.16, cy + size * 0.42);
      ctx.stroke();
    }
  } else if (icon === 'cloud-lightning') {
    drawCloud(ctx, cx, cy - size * 0.1, size, '#5f8f6a');
    ctx.fillStyle = '#d9a93c';
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.02, cy + size * 0.18);
    ctx.lineTo(cx - size * 0.15, cy + size * 0.42);
    ctx.lineTo(cx + size * 0.02, cy + size * 0.42);
    ctx.lineTo(cx - size * 0.04, cy + size * 0.6);
    ctx.lineTo(cx + size * 0.22, cy + size * 0.32);
    ctx.lineTo(cx + size * 0.05, cy + size * 0.32);
    ctx.closePath();
    ctx.fill();
  } else if (icon === 'cloud-snow') {
    drawCloud(ctx, cx, cy - size * 0.12, size, '#5f8f6a');
    ctx.fillStyle = '#7f9fb5';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(cx + i * size * 0.24, cy + size * 0.32, size * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (icon === 'cloud-fog') {
    drawCloud(ctx, cx, cy - size * 0.14, size, '#6e8c78');
    ctx.strokeStyle = '#8aa292';
    ctx.lineWidth = Math.max(1.5, size * 0.05);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.28 + i * size * 0.05, cy + size * 0.22 + i * size * 0.13);
      ctx.lineTo(cx + size * 0.28 - i * size * 0.04, cy + size * 0.22 + i * size * 0.13);
      ctx.stroke();
    }
  } else {
    drawCloud(ctx, cx, cy, size);
  }
  ctx.restore();
}

function drawDroplet(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.55);
  ctx.bezierCurveTo(x + size * 0.55, y + size * 0.05, x + size * 0.42, y + size * 0.55, x, y + size * 0.55);
  ctx.bezierCurveTo(x - size * 0.42, y + size * 0.55, x - size * 0.55, y + size * 0.05, x, y - size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWind(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.2, size * 0.16);
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const offset = i * size * 0.36;
    ctx.beginPath();
    ctx.moveTo(x, y + offset);
    ctx.lineTo(x + size * (i === 1 ? 1.15 : 0.86), y + offset);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x + size * 0.9, y + size * 0.36, size * 0.2, Math.PI, Math.PI * 2.25);
  ctx.stroke();
  ctx.restore();
}

function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(value: string | null, lang: Lang): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** Wait for the webfonts used by canvas so Bengali conjuncts render correctly. */
async function ensureFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load('400 24px "Hind Siliguri"', 'অআকখগ'),
      document.fonts.load('600 24px "Hind Siliguri"', 'অআকখগ'),
      document.fonts.load('700 48px "Hind Siliguri"', 'অআকখগ'),
      document.fonts.load('400 24px Inter', 'ABCD'),
      document.fonts.load('700 48px Inter', 'ABCD'),
    ]);
    await document.fonts.ready;
  } catch {
    // A fallback system font is still usable if a font fails to load.
  }
}

/**
 * Render the weather infographic to an in-memory canvas at its full resolution.
 * The caller can display it, convert it to a PNG Blob, or share it as a File.
 */
export async function renderWeatherShareImage(options: WeatherImageOptions): Promise<HTMLCanvasElement> {
  const { weather, lang, format, siteUrl, copy, now = new Date() } = options;
  const dimensions = WEATHER_IMAGE_FORMATS[format];
  const { width, height } = dimensions;
  const divisions = normalizeWeatherDivisions(weather);

  await ensureFonts();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');

  const margin = format === 'landscape' ? 44 : 54;
  const logoSize = format === 'landscape' ? 48 : 62;
  const titleSize = format === 'landscape' ? 34 : format === 'portrait' ? 54 : 50;
  const subtitleSize = format === 'landscape' ? 13 : 16;
  const headerBottom = format === 'landscape' ? 186 : format === 'portrait' ? 294 : 268;
  const footerY = height - (format === 'landscape' ? 58 : 76);
  const gridTop = headerBottom;
  const gridHeight = footerY - gridTop - (format === 'landscape' ? 12 : 24);
  const gap = format === 'landscape' ? 13 : 16;
  const cardWidth = (width - margin * 2 - gap * (dimensions.columns - 1)) / dimensions.columns;
  const cardHeight = (gridHeight - gap * (dimensions.rows - 1)) / dimensions.rows;

  // Background and decorative shapes.
  ctx.fillStyle = '#f6f1e3';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(31, 81, 50, 0.055)';
  ctx.beginPath();
  ctx.arc(width + 40, 30, format === 'landscape' ? 230 : 340, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(217, 185, 92, 0.16)';
  ctx.beginPath();
  ctx.arc(width - 110, format === 'landscape' ? 90 : 150, format === 'landscape' ? 64 : 92, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(158, 197, 143, 0.14)';
  ctx.beginPath();
  ctx.arc(-50, height - 20, format === 'landscape' ? 150 : 250, 0, Math.PI * 2);
  ctx.fill();

  // Header: logo + brand + date.
  drawLogo(ctx, margin, margin, logoSize);
  const brandX = margin + logoSize + 16;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#173d27';
  ctx.font = resolveFont(lang, 700, format === 'landscape' ? 19 : 24);
  ctx.fillText(truncateText(ctx, copy.footer, width * 0.52), brandX, margin + logoSize * 0.42);
  ctx.fillStyle = '#5c6f5f';
  ctx.font = resolveFont(lang, 500, format === 'landscape' ? 11 : 13);
  ctx.fillText(
    lang === 'bn' ? 'শাহ কৃষি তথ্য পাঠাগার ও জাদুঘর' : 'Shah Agriculture Information Library & Museum',
    brandX,
    margin + logoSize * 0.42 + (format === 'landscape' ? 18 : 22),
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#3f5a3a';
  ctx.font = resolveFont(lang, 600, format === 'landscape' ? 12 : 14);
  ctx.fillText(formatDate(now, lang), width - margin, margin + 16);
  ctx.fillStyle = '#7b8b7b';
  ctx.font = resolveFont(lang, 400, format === 'landscape' ? 10 : 12);
  ctx.fillText(`${width} × ${height}`, width - margin, margin + (format === 'landscape' ? 32 : 38));

  // Title block.
  const titleY = margin + logoSize + (format === 'landscape' ? 38 : 58);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1f5132';
  ctx.font = resolveFont(lang, 700, titleSize);
  ctx.fillText(truncateText(ctx, copy.title, width - margin * 2), margin, titleY);

  const updated = formatDateTime(latestFetchedAt(divisions), lang);
  const subtitle = updated ? `${copy.subtitle}  ·  ${copy.updated}: ${updated}` : copy.subtitle;
  ctx.fillStyle = '#5c6f5f';
  ctx.font = resolveFont(lang, 500, subtitleSize);
  ctx.fillText(truncateText(ctx, subtitle, width - margin * 2), margin, titleY + (format === 'landscape' ? 24 : 32));

  // Accent rule.
  ctx.fillStyle = '#d9b95c';
  roundRectPath(ctx, margin, titleY + (format === 'landscape' ? 38 : 50), format === 'landscape' ? 54 : 70, 4, 2);
  ctx.fill();

  // Division cards.
  divisions.forEach((division, index) => {
    const column = index % dimensions.columns;
    const row = Math.floor(index / dimensions.columns);
    const x = margin + column * (cardWidth + gap);
    const y = gridTop + row * (cardHeight + gap);
    drawDivisionCard(ctx, {
      x,
      y,
      width: cardWidth,
      height: cardHeight,
      division,
      lang,
      copy,
      compact: format === 'landscape',
    });
  });

  // Footer.
  ctx.strokeStyle = 'rgba(31, 81, 50, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, footerY);
  ctx.lineTo(width - margin, footerY);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#5c6f5f';
  ctx.font = resolveFont(lang, 500, format === 'landscape' ? 11 : 13);
  ctx.fillText(copy.footer, margin, footerY + (format === 'landscape' ? 22 : 28));

  const host = siteUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  ctx.textAlign = 'right';
  ctx.fillStyle = '#1f5132';
  ctx.font = resolveFont(lang, 700, format === 'landscape' ? 11 : 13);
  ctx.fillText(host, width - margin, footerY + (format === 'landscape' ? 22 : 28));

  return canvas;
}

function drawDivisionCard(
  ctx: CanvasRenderingContext2D,
  {
    x,
    y,
    width,
    height,
    division,
    lang,
    copy,
    compact,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    division: WeatherEntry;
    lang: Lang;
    copy: WeatherImageCopy;
    compact: boolean;
  },
) {
  const pad = compact ? 14 : 18;
  const available = division.ok && division.temperature !== null;
  const name = lang === 'bn' ? division.nameBn : division.nameEn;
  const condition = lang === 'bn'
    ? division.conditionBn || division.condition || copy.unavailable
    : division.condition || division.conditionBn || copy.unavailable;
  const unit = division.units === 'metric' ? 'C' : 'F';
  const windUnit = division.units === 'metric' ? 'km/h' : 'mph';

  ctx.save();
  ctx.shadowColor = 'rgba(23, 61, 39, 0.09)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#fffdf7';
  roundRectPath(ctx, x, y, width, height, compact ? 14 : 18);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(31, 81, 50, 0.1)';
  ctx.lineWidth = 1.2;
  roundRectPath(ctx, x, y, width, height, compact ? 14 : 18);
  ctx.stroke();

  // Small green accent at the top-left corner.
  ctx.fillStyle = available ? '#1f5132' : '#b7b29f';
  roundRectPath(ctx, x + pad, y + pad, compact ? 3 : 4, compact ? 22 : 30, 2);
  ctx.fill();

  const textX = x + pad + (compact ? 11 : 13);
  const iconSize = compact ? 34 : 44;
  const iconCx = x + width - pad - iconSize / 2;
  const iconCy = y + pad + iconSize / 2;

  ctx.fillStyle = available ? 'rgba(158, 197, 143, 0.22)' : 'rgba(183, 178, 159, 0.2)';
  ctx.beginPath();
  ctx.arc(iconCx, iconCy, iconSize / 2, 0, Math.PI * 2);
  ctx.fill();
  drawWeatherIcon(ctx, division.icon, iconCx, iconCy, iconSize * 0.68);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#173d27';
  ctx.font = resolveFont(lang, 700, compact ? 16 : 20);
  ctx.fillText(truncateText(ctx, name, width - pad * 2 - iconSize - 10), textX, y + pad + (compact ? 15 : 20));

  ctx.fillStyle = available ? '#5c6f5f' : '#968f7f';
  ctx.font = resolveFont(lang, 500, compact ? 11 : 13);
  ctx.fillText(
    truncateText(ctx, condition, width - pad * 2 - iconSize + (compact ? 10 : 6)),
    textX,
    y + pad + (compact ? 33 : 42),
  );

  const tempY = y + height - pad - (compact ? 16 : 24);
  const tempSize = compact ? 36 : 46;
  ctx.fillStyle = available ? '#1f5132' : '#96907f';
  ctx.font = resolveFont(lang, 700, tempSize);
  const tempText = available ? `${formatNumber(division.temperature as number, lang)}°` : '—';
  ctx.fillText(tempText, textX, tempY + (compact ? 5 : 10));
  const tempWidth = ctx.measureText(tempText).width;

  if (available) {
    ctx.fillStyle = '#7b8b7b';
    ctx.font = resolveFont(lang, 500, compact ? 12 : 14);
    ctx.fillText(unit, textX + tempWidth + 2, tempY + (compact ? 5 : 10));
  }

  // Humidity and wind, right-aligned at the bottom of the card.
  const metricsRight = x + width - pad;
  const humidityY = y + height - pad - (compact ? 26 : 34);
  const windY = y + height - pad - (compact ? 10 : 12);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#5c6f5f';
  ctx.font = resolveFont(lang, 500, compact ? 10 : 12);
  const humidity = division.humidity == null ? '—' : `${formatNumber(division.humidity, lang)}%`;
  const wind = division.windSpeed == null ? '—' : `${formatNumber(division.windSpeed, lang)} ${windUnit}`;
  ctx.fillText(`${copy.humidity}  ${humidity}`, metricsRight, humidityY);
  ctx.fillText(`${copy.wind}  ${wind}`, metricsRight, windY);

  drawDroplet(ctx, metricsRight - ctx.measureText(`${copy.humidity}  ${humidity}`).width - 9, humidityY - 4, compact ? 7 : 8, '#7fa8c4');
  drawWind(ctx, metricsRight - ctx.measureText(`${copy.wind}  ${wind}`).width - 13, windY - 6, compact ? 6 : 7, '#8aa292');
  ctx.restore();
}
