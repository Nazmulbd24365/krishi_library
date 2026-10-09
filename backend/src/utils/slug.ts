export function slugify(input: string): string {
  const base = input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `item-${Date.now().toString(36)}`;
}

export function uniqueSlug(input: string): string {
  return `${slugify(input)}-${Math.random().toString(36).slice(2, 7)}`;
}
