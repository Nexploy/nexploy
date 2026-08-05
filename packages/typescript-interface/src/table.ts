export type SortDirection = 'asc' | 'desc';

export const PAGE_SIZE_ALL = 'all';

export type PageSize = number | typeof PAGE_SIZE_ALL;

export interface PaginatedResult<TEntry> {
    entries: TEntry[];
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
}

export interface PaginationQuery {
    page?: number;
    pageSize?: PageSize;
    search?: string;
    sortBy?: string;
    sortOrder?: SortDirection;
}
