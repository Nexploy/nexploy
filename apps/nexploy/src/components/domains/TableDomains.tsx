'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { Input } from '@workspace/ui/components/input';
import { deleteDomain } from '@/actions/domains/deleteDomain.action';
import { DomainForm } from '@/components/domains/DomainForm';
import { getColumnsDomains } from '@/components/domains/ColumnsDomains';
import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';
import { useClientTablePagination } from '@/hooks/useClientTablePagination';

interface DomainsTableProps {
    domains: Domain[];
}

export function TableDomains({ domains }: DomainsTableProps) {
    const t = useTranslations('repository.settings.domains');
    const tCommon = useTranslations('common');
    const router = useRouter();

    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const handleEdit = (domain: Domain) => {
        openDialog({
            title: t('editTitle'),
            description: t('editDescription', { host: domain.host }),
            props: { className: 'md:max-w-[700px]' },
            content: <DomainForm domain={domain} />,
            onSuccess: () => {
                closeDialog();
                router.refresh();
            },
        });
    };

    const handleDelete = (domain: Domain) => {
        const host = domain.host || t('newDomain');
        openAlertDialog({
            title: t('removeTitle'),
            description: t('removeDescription', { host }),
            cancelLabel: t('cancel'),
            actionLabel: t('remove'),
            onAction: async () => await deleteDomain({ domainId: domain.id! }),
        });
    };

    const pagination = useClientTablePagination();

    const table = useReactTable({
        data: domains,
        columns: getColumnsDomains((key, values) => t(key, values), {
            onEdit: handleEdit,
            onDelete: handleDelete,
        }),
        getRowId: (row) => row.id ?? row.host,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row, _, value) => row.original.host.toLowerCase().includes(String(value).toLowerCase()),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: pagination.onPaginationChange,
        state: { sorting, globalFilter, pagination: pagination.state },
    });

    pagination.clampToPageCount(table.getPageCount());

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap justify-between gap-3">
                <Input
                    className="w-56 shadow-xs"
                    placeholder={t('searchPlaceholder')}
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
            </div>

            <TableShell
                table={table}
                emptyLabel={t('noDomains')}
                noResultsLabel={t('noMatchingDomains')}
                hasActiveFilters={domains.length > 0}
            />

            <TablePagination
                table={table}
                pageSize={pagination.pageSize}
                onPageSizeChange={pagination.setPageSize}
                perPageLabel={t('perPage')}
                allowAllPageSize
            />
        </div>
    );
}
