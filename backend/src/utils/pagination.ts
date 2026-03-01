import { Request } from 'express';
import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
});

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(query: Request['query']): PaginationOptions {
  const parsed = PaginationSchema.parse(query);
  return {
    page: parsed.page,
    limit: parsed.limit,
    skip: (parsed.page - 1) * parsed.limit,
  };
}

export interface PaginationMeta extends Record<string, unknown> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function buildPaginationMeta(total: number, opts: PaginationOptions): PaginationMeta {
  const totalPages = Math.ceil(total / opts.limit);
  return {
    total,
    page: opts.page,
    limit: opts.limit,
    totalPages,
    hasNextPage: opts.page < totalPages,
    hasPrevPage: opts.page > 1,
  };
}
