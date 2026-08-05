import {
    PAGE_SIZE_ALL,
    type PaginatedResult,
    type PaginationQuery,
    type SortDirection,
} from '@workspace/typescript-interface/table';
import { PAGE_SIZE_FALLBACK, PAGE_SIZE_MAX, PAGE_SIZE_MIN } from '@workspace/schemas-zod/table/pagination.schema';

export interface ResolvedPagination {
    page: number;
    pageSize: number;
    pageCount: number;
    skip: number;
    take: number;
}

export function clampPage(page: number, pageCount: number): number {
    return Math.min(Math.max(1, page), Math.max(1, pageCount));
}

export function resolvePagination(
    query: PaginationQuery,
    total: number,
    defaultPageSize = PAGE_SIZE_FALLBACK,
): ResolvedPagination {
    const isAll = query.pageSize === PAGE_SIZE_ALL;
    const requestedPageSize = Number(query.pageSize) || defaultPageSize;

    const pageSize = isAll ? Math.max(1, total) : Math.min(PAGE_SIZE_MAX, Math.max(PAGE_SIZE_MIN, requestedPageSize));

    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = isAll ? 1 : clampPage(query.page ?? 1, pageCount);

    return { page, pageSize, pageCount, skip: (page - 1) * pageSize, take: pageSize };
}

export function resolveSortDirection(sortOrder: SortDirection | undefined, fallback: SortDirection): SortDirection {
    return sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : fallback;
}

export function resolveOrderBy<TOrderBy>(
    query: PaginationQuery,
    builders: Record<string, (direction: SortDirection) => TOrderBy>,
    fallbackField: string,
    fallbackDirection: SortDirection = 'desc',
): TOrderBy {
    const build = (query.sortBy && builders[query.sortBy]) || builders[fallbackField];
    const direction = resolveSortDirection(query.sortOrder, fallbackDirection);

    if (!build) throw new Error(`Unknown sort field: ${fallbackField}`);

    return build(direction);
}

export function toPaginatedResult<TEntry>(
    entries: TEntry[],
    { total, page, pageSize }: { total: number; page: number; pageSize: number },
): PaginatedResult<TEntry> {
    return {
        entries,
        total,
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
}
