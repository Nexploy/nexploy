'use client';

import {
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@workspace/ui/components/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { useRequestsStore } from '@/stores/traefik/useRequestsStore';
import { getColumnsTableRequests } from '@/components/traefik/table/ColumnsRequests';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';
import { useClientTablePagination } from '@/hooks/useClientTablePagination';

export function TableRequests() {
    const t = useTranslations('requests');
    const tCommon = useTranslations('common');

    const {
        filteredRequests,
        requests,
        lastUpdate,
        searchQuery,
        methodFilter,
        statusFilter,
        serviceFilter,
        setSearchQuery,
        setMethodFilter,
        setStatusFilter,
        setServiceFilter,
    } = useRequestsStore();

    const [sorting, setSorting] = useState<SortingState>([]);

    const columns = useMemo(() => getColumnsTableRequests(t), [t]);

    const serviceOptions = useMemo(() => {
        const names = new Set<string>();
        for (const request of requests) {
            if (request.serviceName) {
                names.add(request.serviceName);
            }
        }
        return Array.from(names).sort((a, b) => a.localeCompare(b));
    }, [requests]);

    const isLoading = !lastUpdate;
    const isEmpty = requests.length === 0;

    const pagination = useClientTablePagination();

    const table = useReactTable({
        data: filteredRequests,
        columns,
        getRowId: (row) => row.id,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: pagination.onPaginationChange,
        state: {
            sorting,
            pagination: pagination.state,
        },
    });

    pagination.clampToPageCount(table.getPageCount());

    return (
        <div className="mx-5 space-y-3">
            <div className="flex flex-wrap justify-between gap-3">
                <Input
                    className="shadow-xs w-56"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex gap-2">
                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                        <SelectTrigger className={'min-w-40'}>
                            <SelectValue placeholder={t('method')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{t('method')}</SelectLabel>
                                <SelectItem value="all">{t('allMethods')}</SelectItem>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="PATCH">PATCH</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className={'min-w-40'}>
                            <SelectValue placeholder={t('status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{t('status')}</SelectLabel>
                                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                                <SelectItem value="2xx">{t('success2xx')}</SelectItem>
                                <SelectItem value="3xx">{t('redirect3xx')}</SelectItem>
                                <SelectItem value="4xx">{t('clientError4xx')}</SelectItem>
                                <SelectItem value="5xx">{t('serverError5xx')}</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Select value={serviceFilter} onValueChange={setServiceFilter}>
                        <SelectTrigger className={'min-w-40'}>
                            <SelectValue placeholder={t('service')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{t('service')}</SelectLabel>
                                <SelectItem value="all">{t('allServices')}</SelectItem>
                                {serviceOptions.map((service) => (
                                    <SelectItem key={service} value={service}>
                                        {service}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <TableShell
                table={table}
                isLoading={isLoading}
                emptyLabel={t('noRequests')}
                noResultsLabel={t('noMatchingRequests')}
                hasActiveFilters={!isEmpty}
            />

            {!isLoading && !!filteredRequests.length && (
                <TablePagination
                    table={table}
                    pageSize={pagination.pageSize}
                    onPageSizeChange={pagination.setPageSize}
                    perPageLabel={t('requestsPerPage')}
                    allowAllPageSize
                />
            )}
        </div>
    );
}
