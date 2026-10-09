import { describe, expect, it } from 'vitest';
import { bookSchema, contactSchema, videoSchema } from '../../modules/schemas';

describe('book import / admin validation', () => {
  it('accepts a valid book', () => {
    const result = bookSchema.safeParse({
      nameBn: 'কৃষি বিজ্ঞান',
      copies: 3,
      serialNo: 1,
      publicationYear: 2020,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name and negative copies', () => {
    expect(bookSchema.safeParse({ nameBn: '', copies: -1 }).success).toBe(false);
  });

  it('coerces numeric strings', () => {
    const parsed = bookSchema.parse({ nameBn: 'X', copies: '4', serialNo: '2' });
    expect(parsed.copies).toBe(4);
    expect(parsed.serialNo).toBe(2);
  });
});

describe('video schema', () => {
  it('defaults the category', () => {
    const parsed = videoSchema.parse({ titleBn: 'T', youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ' });
    expect(parsed.category).toBe('krishi-news');
  });
});

describe('contact schema', () => {
  it('requires consent and a valid email', () => {
    expect(contactSchema.safeParse({ name: 'A', email: 'bad', message: 'hello world' }).success).toBe(false);
    expect(
      contactSchema.safeParse({ name: 'Ali', email: 'a@b.com', message: 'hello world', consent: true }).success,
    ).toBe(true);
  });
});
