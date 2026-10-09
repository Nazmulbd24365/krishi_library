/**
 * Bangladesh (revised) Bengali calendar conversion.
 *
 * Rules implemented:
 *  - Pohela Boishakh falls on 14 April (Bangladesh modern calendar).
 *  - Months Boishakh..Ashwin have 31 days; Kartik..Choitro have 30 days,
 *    except Falgun which has 29 days (30 in a leap year).
 *  - Falgun gains its extra day when the Gregorian year in which it occurs
 *    is a leap year.
 *  - The Bengali year advances at Bangladesh midnight (Asia/Dhaka).
 *
 * This is deliberately NOT a translated Gregorian calendar: month boundaries,
 * month names and the year offset are computed from a real conversion.
 */

export interface BengaliDate {
  gregorian: { year: number; month: number; day: number; weekday: number };
  year: number;
  monthIndex: number; // 0 = Boishakh
  monthBn: string;
  monthEn: string;
  day: number;
  weekdayBn: string;
  weekdayEn: string;
  isLeapFalgun: boolean;
}

export const BN_MONTHS: { bn: string; en: string; days: number }[] = [
  { bn: 'বৈশাখ', en: 'Boishakh', days: 31 },
  { bn: 'জ্যৈষ্ঠ', en: 'Joishtho', days: 31 },
  { bn: 'আষাঢ়', en: 'Ashar', days: 31 },
  { bn: 'শ্রাবণ', en: 'Srabon', days: 31 },
  { bn: 'ভাদ্র', en: 'Bhadro', days: 31 },
  { bn: 'আশ্বিন', en: 'Ashwin', days: 31 },
  { bn: 'কার্তিক', en: 'Kartik', days: 30 },
  { bn: 'অগ্রহায়ণ', en: 'Ogrohayon', days: 30 },
  { bn: 'পৌষ', en: 'Poush', days: 30 },
  { bn: 'মাঘ', en: 'Magh', days: 30 },
  { bn: 'ফাল্গুন', en: 'Falgun', days: 29 },
  { bn: 'চৈত্র', en: 'Choitro', days: 30 },
];

export const BN_WEEKDAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const EN_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumerals(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

function isGregorianLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const DAY_MS = 86_400_000;

/** Extract Y/M/D + weekday as observed in the Asia/Dhaka time zone. */
export function dhakaParts(date: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const year = Number(get('year'));
  const month = Number(get('month'));
  const day = Number(get('day'));
  const weekdayShort = get('weekday');
  const weekday = EN_WEEKDAYS.findIndex((d) => d.startsWith(weekdayShort));
  return { year, month, day, weekday: weekday < 0 ? new Date(Date.UTC(year, month - 1, day)).getUTCDay() : weekday };
}

export function toBengaliDate(date: Date = new Date()): BengaliDate {
  const g = dhakaParts(date);
  const utc = Date.UTC(g.year, g.month - 1, g.day);
  const poilaBoishakh = Date.UTC(g.year, 3, 14); // 14 April

  let startYear: number;
  if (utc >= poilaBoishakh) startYear = g.year;
  else startYear = g.year - 1;

  const start = Date.UTC(startYear, 3, 14);
  let remaining = Math.floor((utc - start) / DAY_MS);
  const isLeapFalgun = isGregorianLeap(startYear + 1);

  const year = startYear - 593;
  let monthIndex = 0;
  for (let i = 0; i < BN_MONTHS.length; i++) {
    const days = i === 10 && isLeapFalgun ? 30 : BN_MONTHS[i].days;
    if (remaining < days) {
      monthIndex = i;
      break;
    }
    remaining -= days;
  }

  return {
    gregorian: g,
    year,
    monthIndex,
    monthBn: BN_MONTHS[monthIndex].bn,
    monthEn: BN_MONTHS[monthIndex].en,
    day: remaining + 1,
    weekdayBn: BN_WEEKDAYS[g.weekday] ?? '',
    weekdayEn: EN_WEEKDAYS[g.weekday] ?? '',
    isLeapFalgun,
  };
}

export function formatBengaliDate(date: Date = new Date()): string {
  const b = toBengaliDate(date);
  return `${b.weekdayBn}, ${toBengaliNumerals(b.day)} ${b.monthBn} ${toBengaliNumerals(b.year)} বঙ্গাব্দ`;
}

export function formatEnglishDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
