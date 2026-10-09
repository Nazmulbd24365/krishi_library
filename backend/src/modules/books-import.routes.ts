import { Router } from 'express';
import ExcelJS from 'exceljs';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/async-handler';
import { ok } from '../utils/api-response';
import { ApiError } from '../utils/http-error';
import { uploadExcel } from '../middleware/upload';
import { CAN_EDIT, requireAuth, requireRole } from '../middleware/auth';
import { audit } from '../services/audit.service';
import { bookSchema } from './schemas';
import { slugify } from '../utils/slug';
import { logger } from '../utils/logger';

const router = Router();
router.use(requireAuth, requireRole(...CAN_EDIT));

const COLUMNS: { header: string; key: string }[] = [
  { header: 'Serial Number', key: 'serialNo' },
  { header: 'Book Name', key: 'nameBn' },
  { header: 'Book Name (English)', key: 'nameEn' },
  { header: 'Author Name', key: 'authorBn' },
  { header: 'Author Name (English)', key: 'authorEn' },
  { header: 'Number of Copies', key: 'copies' },
  { header: 'Rack Number', key: 'rackNo' },
  { header: 'Category', key: 'categoryName' },
  { header: 'ISBN', key: 'isbn' },
  { header: 'Publisher', key: 'publisher' },
  { header: 'Publication Year', key: 'publicationYear' },
  { header: 'Language', key: 'language' },
  { header: 'Description', key: 'description' },
  { header: 'Keywords', key: 'keywords' },
];

interface RowError {
  row: number;
  field: string;
  message: string;
}

function cellValue(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v == null) return '';
  if (typeof v === 'object') {
    // Never trust formulas: use the cached result only.
    if ('result' in v && v.result != null) return String(v.result).trim();
    if ('text' in v && v.text) return String(v.text).trim();
    if (v instanceof Date) return v.toISOString();
    return '';
  }
  return String(v).trim();
}

function parseNumberField(raw: string): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/** Download a documented import template. */
router.get(
  '/template',
  asyncHandler(async (_req, res) => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Books');
    ws.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: 24 }));
    ws.addRow({
      serialNo: 1,
      nameBn: 'কৃষি বিজ্ঞান',
      nameEn: 'Agricultural Science',
      authorBn: 'মো. উদাহরণ',
      authorEn: 'Example Author',
      copies: 3,
      rackNo: 'A-1',
      categoryName: 'General',
      isbn: '978-0000000000',
      publisher: 'SAIL',
      publicationYear: 2020,
      language: 'bn',
      description: 'Sample row - replace with real data',
      keywords: 'agriculture, science',
    });
    ws.getRow(1).font = { bold: true };
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="book-import-template.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  }),
);

/**
 * Import books from an uploaded .xlsx file.
 * Query: commit=true to persist, duplicatePolicy=skip|update, createCategories=true
 * Without commit=true the request is a validated preview.
 */
router.post(
  '/import',
  uploadExcel.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('Upload an .xlsx file in the "file" field');
    const commit = req.query.commit === 'true';
    const policy = req.query.duplicatePolicy === 'update' ? 'update' : 'skip';
    const createCategories = req.query.createCategories === 'true';

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer as never);
    const ws = wb.worksheets[0];
    if (!ws) throw ApiError.badRequest('The workbook has no worksheet');

    // Map header text -> key
    const headerKeys = new Map<number, string>();
    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell, col) => {
      const text = cellValue(cell).toLowerCase();
      const found = COLUMNS.find((c) => c.header.toLowerCase() === text || c.key.toLowerCase() === text);
      if (found) headerKeys.set(col, found.key);
    });
    if (headerKeys.size === 0) throw ApiError.badRequest('No recognizable columns found. Download the template.');

    const errors: RowError[] = [];
    const valid: Record<string, unknown>[] = [];
    const seen = new Set<string>();

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const raw: Record<string, string> = {};
      headerKeys.forEach((key, col) => {
        raw[key] = cellValue(row.getCell(col));
      });
      if (!raw.nameBn && !raw.nameEn) continue; // skip blank line

      const parsed = {
        serialNo: parseNumberField(raw.serialNo) ?? null,
        nameBn: raw.nameBn || raw.nameEn || '',
        nameEn: raw.nameEn || null,
        authorBn: raw.authorBn || null,
        authorEn: raw.authorEn || null,
        copies: parseNumberField(raw.copies) ?? 1,
        rackNo: raw.rackNo || null,
        categoryName: raw.categoryName || null,
        isbn: raw.isbn || null,
        publisher: raw.publisher || null,
        publicationYear: parseNumberField(raw.publicationYear) ?? null,
        language: raw.language || 'bn',
        description: raw.description || null,
        keywords: raw.keywords || null,
      };

      const dupKey = (parsed.isbn || `${parsed.nameBn}|${parsed.authorBn}`).toLowerCase();
      if (seen.has(dupKey)) {
        errors.push({ row: r, field: 'nameBn', message: 'Duplicate row within the file' });
        continue;
      }
      seen.add(dupKey);

      const check = bookSchema
        .omit({ categoryId: true, coverImage: true, isAvailable: true, status: true })
        .safeParse(parsed);
      if (!check.success) {
        Object.entries(check.error.flatten().fieldErrors).forEach(([field, msgs]) => {
          errors.push({ row: r, field, message: (msgs ?? []).join(', ') });
        });
        continue;
      }
      valid.push({ ...parsed, categoryName: parsed.categoryName, rowNumber: r });
    }

    // Resolve categories
    const categoryNames = [...new Set(valid.map((v) => v.categoryName as string).filter(Boolean))];
    const categories = await prisma.bookCategory.findMany({
      where: { nameBn: { in: categoryNames } },
    });
    const catMap = new Map(categories.map((c) => [c.nameBn.toLowerCase(), c.id]));

    const dbDuplicates = valid.length
      ? await prisma.book.findMany({
          where: {
            OR: [
              { isbn: { in: valid.map((v) => v.isbn as string).filter(Boolean) } },
              { nameBn: { in: valid.map((v) => v.nameBn as string).filter(Boolean) } },
            ],
          },
          select: { id: true, isbn: true, nameBn: true, authorBn: true },
        })
      : [];
    const dbDup = new Map<string, { id: string }>();
    dbDuplicates.forEach((b) => {
      if (b.isbn) dbDup.set(b.isbn.toLowerCase(), { id: b.id });
      dbDup.set(`${b.nameBn}|${b.authorBn ?? ''}`.toLowerCase(), { id: b.id });
    });

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    const resolveCategoryId = async (name: string | null): Promise<string | null> => {
      if (!name) return null;
      const key = name.toLowerCase();
      if (catMap.has(key)) return catMap.get(key)!;
      if (!createCategories) return null;
      const cat = await prisma.bookCategory.create({ data: { nameBn: name, slug: slugify(name) } });
      catMap.set(key, cat.id);
      return cat.id;
    };

    const staged = [] as { data: Record<string, unknown>; existingId?: string }[];
    for (const v of valid) {
      const rowNumber = v.rowNumber as number;
      delete v.rowNumber;
      const dupKey = ((v.isbn as string) || `${v.nameBn}|${v.authorBn ?? ''}`).toLowerCase();
      const existing = dbDup.get(dupKey);
      if (existing) {
        if (policy === 'skip') {
          skipped++;
          continue;
        }
        staged.push({ data: v, existingId: existing.id });
      } else {
        staged.push({ data: v });
      }
    }

    if (commit) {
      // Resolve every category up-front so the transaction stays consistent.
      const resolved = [] as { data: Record<string, unknown>; existingId?: string }[];
      for (const item of staged) {
        const categoryName = item.data.categoryName as string | null;
        const categoryId = await resolveCategoryId(categoryName);
        const data: Record<string, unknown> = { ...item.data, categoryId };
        delete data.categoryName;
        resolved.push({ data, existingId: item.existingId });
      }

      await prisma.$transaction(async (tx) => {
        for (const item of resolved) {
          if (item.existingId) {
            await tx.book.update({ where: { id: item.existingId }, data: item.data as never });
            updated++;
          } else {
            await tx.book.create({ data: item.data as never });
            inserted++;
          }
        }
      });
      await audit({ userId: req.user!.sub, action: 'import', entity: 'Book', metadata: { inserted, updated, skipped, failed: errors.length }, ip: req.ip });
      logger.info({ inserted, updated, skipped, failed: errors.length }, 'Book import committed');
    }

    return ok(res, {
      committed: commit,
      duplicatePolicy: policy,
      detectedColumns: [...headerKeys.values()],
      summary: {
        totalRows: valid.length + errors.length,
        validRows: valid.length,
        inserted,
        updated,
        skipped,
        failed: errors.length,
      },
      errors: errors.slice(0, 200),
      preview: commit ? [] : valid.slice(0, 50),
    });
  }),
);

export default router;
