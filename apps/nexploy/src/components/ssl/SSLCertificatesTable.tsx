'use client';

import {
    FilterFn,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { getColumnsSSL, SSLCertRow } from '@/components/ssl/ColumnsSSL';
import { useTranslations } from 'next-intl';
import { Input } from '@workspace/ui/components/input';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { EditCustomCertForm } from '@/components/domains/EditCustomCertForm';
import { deleteSslCert } from '@/actions/repository/sslCertificate/deleteSslCert.action';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';
import { useClientTablePagination } from '@/hooks/useClientTablePagination';

interface SSLCertificatesTableProps {
    certificates: SSLCertRow[];
}

const globalFilterFn: FilterFn<SSLCertRow> = (row, _, value) => {
    const search = value.toLowerCase();
    const { name, domain, coveredDomains } = row.original;
    return (
        name.toLowerCase().includes(search) ||
        domain.toLowerCase().includes(search) ||
        coveredDomains.some((coveredDomain) => coveredDomain.toLowerCase().includes(search))
    );
};

export function SSLCertificatesTable({ certificates }: SSLCertificatesTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const t = useTranslations('admin.ssl');
    const tSsl = useTranslations('repository.settings.ssl');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const handleEdit = (cert: SSLCertRow) => {
        openDialog({
            title: tSsl('editCustom'),
            content: <EditCustomCertForm certificate={cert} onClose={closeDialog} />,
        });
    };

    const handleDelete = (cert: SSLCertRow) => {
        openAlertDialog({
            title: tSsl('deleteTitle'),
            description: tSsl('deleteDescription'),
            cancelLabel: tSsl('cancel'),
            actionLabel: tSsl('delete'),
            onAction: async () => {
                const result = await deleteSslCert({ id: cert.id });
                if (!result?.serverError) {
                    toast.success(tSsl('deletedSuccess'));
                    router.refresh();
                }
            },
        });
    };

    const pagination = useClientTablePagination();

    const table = useReactTable({
        data: certificates,
        columns: getColumnsSSL((key, values) => tSsl(key, values), {
            onEdit: handleEdit,
            onDelete: handleDelete,
        }),
        getRowId: (row) => row.id,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: pagination.onPaginationChange,
        state: { sorting, globalFilter, pagination: pagination.state },
    });

    pagination.clampToPageCount(table.getPageCount());

    const isEmpty = certificates.length === 0;

    return (
        <div className="space-y-3 pt-1 pb-5">
            <div className="flex flex-wrap justify-between gap-3">
                <Input
                    className="w-56 shadow-xs"
                    placeholder={tCommon('searchPlaceholder')}
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
            </div>
            <TableShell
                table={table}
                emptyLabel={t('noCertificates')}
                noResultsLabel={t('noResults')}
                hasActiveFilters={!isEmpty}
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
