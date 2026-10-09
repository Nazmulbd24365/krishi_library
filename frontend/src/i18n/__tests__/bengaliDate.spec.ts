import { describe, expect, it } from 'vitest';
import { toBengaliDate, toBengaliNumerals, formatBengaliDate } from '../bengaliDate';

// Use a fixed UTC time that corresponds to midday in Dhaka to avoid
// date-boundary ambiguity in tests.
const dhakaNoon = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 6, 0, 0));

describe('Bengali calendar conversion', () => {
  it('maps Pohela Boishakh (14 April) to 1 Boishakh', () => {
    const b = toBengaliDate(dhakaNoon(2024, 4, 14));
    expect(b.monthEn).toBe('Boishakh');
    expect(b.day).toBe(1);
    expect(b.year).toBe(1431);
  });

  it('maps 13 April to the last day of the previous Bengali year (Choitro)', () => {
    const b = toBengaliDate(dhakaNoon(2024, 4, 13));
    expect(b.monthEn).toBe('Choitro');
    expect(b.year).toBe(1430);
    expect(b.day).toBe(30); // 1430 Falgun was 29 (2023 not leap) -> Choitro has 30 days
  });

  it('handles the Bengali year offset before and after Pohela Boishakh', () => {
    expect(toBengaliDate(dhakaNoon(2026, 1, 1)).year).toBe(1432); // before 14 April
    expect(toBengaliDate(dhakaNoon(2026, 5, 1)).year).toBe(1433); // after 14 April
  });

  it('gives Falgun 30 days in a leap Gregorian year', () => {
    // Falgun 1430 falls in Feb 2024 which is a leap Gregorian year.
    const falgun1 = toBengaliDate(dhakaNoon(2024, 2, 14));
    expect(falgun1.monthEn).toBe('Falgun');
    expect(falgun1.day).toBe(1);
    expect(falgun1.isLeapFalgun).toBe(true);
    // 14 March 2024 is the 30th (last) day of Falgun; Choitro begins 15 March.
    expect(toBengaliDate(dhakaNoon(2024, 3, 14)).monthEn).toBe('Falgun');
    expect(toBengaliDate(dhakaNoon(2024, 3, 14)).day).toBe(30);
    expect(toBengaliDate(dhakaNoon(2024, 3, 15)).monthEn).toBe('Choitro');
    expect(toBengaliDate(dhakaNoon(2024, 3, 15)).day).toBe(1);
  });

  it('gives Falgun 29 days in a non-leap Gregorian year', () => {
    // Falgun 1429 falls in Feb 2023 (not leap).
    const b = toBengaliDate(dhakaNoon(2023, 2, 14));
    expect(b.monthEn).toBe('Falgun');
    expect(b.day).toBe(1);
    expect(b.isLeapFalgun).toBe(false);
    // 14 March 2023 is the 29th (last) day of Falgun; Choitro begins 15 March.
    expect(toBengaliDate(dhakaNoon(2023, 3, 14)).monthEn).toBe('Falgun');
    expect(toBengaliDate(dhakaNoon(2023, 3, 14)).day).toBe(29);
    expect(toBengaliDate(dhakaNoon(2023, 3, 15)).monthEn).toBe('Choitro');
    expect(toBengaliDate(dhakaNoon(2023, 3, 15)).day).toBe(1);
  });

  it('renders Bengali numerals and month name', () => {
    expect(toBengaliNumerals(1431)).toBe('১৪৩১');
    expect(formatBengaliDate(dhakaNoon(2024, 4, 14))).toContain('বৈশাখ');
    expect(formatBengaliDate(dhakaNoon(2024, 4, 14))).toContain('১৪৩১');
  });
});
