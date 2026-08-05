import { z } from 'zod';
import { PAGE_SIZE_ALL } from '@workspace/typescript-interface/table';

export const PAGE_SIZE_MIN = 1;
export const PAGE_SIZE_MAX = 500;
export const PAGE_SIZE_FALLBACK = 50;

export const sortDirectionSchema = z.enum(['asc', 'desc']);

export const pageSizeSchema = z
    .union([z.literal(PAGE_SIZE_ALL), z.coerce.number().int().min(PAGE_SIZE_MIN).max(PAGE_SIZE_MAX)])
    .default(PAGE_SIZE_FALLBACK);

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: pageSizeSchema,
    search: z.string().trim().min(1).optional(),
    sortBy: z.string().trim().min(1).optional(),
    sortOrder: sortDirectionSchema.default('desc'),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
