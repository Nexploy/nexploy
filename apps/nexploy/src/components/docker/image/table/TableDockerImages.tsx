'use client';

import {
    ExpandedState,
    FilterFn,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import React, { useMemo, useRef, useState } from 'react';
import { getColumnsTableImages } from '@/components/docker/image/table/ColumnsDockerImages';
import { useTranslations } from 'next-intl';
import { useImagesStore } from '@/stores/docker/useImagesStore.ts';
import { ImageRow } from '@workspace/typescript-interface/docker/docker.image';
import { groupImagesByRepository, matchesSearch } from './imageTableUtils';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { ProtectedAction } from '@/components/permission/ProtectedAction';
import { Download, HardDriveDownload, Play, Trash2, Upload } from 'lucide-react';
import { ImageImportForm } from '@/components/docker/image/actions/ImageImportForm';
import { ImageLoadForm } from '@/components/docker/image/actions/ImageLoadForm';
import { downloadImageArchive } from '@/components/docker/image/actions/downloadImageArchive';
import { Can } from '@/components/permission/Can';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { Badge } from '@workspace/ui/components/badge';
import { onImageAction } from '@/actions/docker/image/imageAction.action';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useRouter } from '@/i18n/navigation';
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';
import { cn } from '@workspace/ui/lib/utils';
import { useDockerStore } from '@/stores/docker/useDockerStore.ts';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';
import { useClientTablePagination } from '@/hooks/useClientTablePagination';

const globalFilterFn: FilterFn<ImageRow> = (row, _, value) => {
    const search = value.toLowerCase();
    const { isGroup, groupName, subRows } = row.original;

    if (isGroup && groupName) {
        if (groupName.toLowerCase().includes(search)) return true;
        return !!subRows?.some((img) => matchesSearch(img, search));
    }

    return matchesSearch(row.original, search);
};

export function TableDockerImages() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [rowSelection, setRowSelection] = useState({});

    const router = useRouter();
    const t = useTranslations('docker.tables');
    const tCommon = useTranslations('common');
    const tImage = useTranslations('docker.imageActions');
    const openDialog = useConfirmationDialogStore((state) => state.openDialog);

    const statusDocker = useDockerStore((state) => state.status);

    const images = useImagesStore((state) => state.images);
    const lastUpdate = useImagesStore((state) => state.lastUpdate);
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const forceRef = useRef(false);

    const groupedImages = useMemo(() => groupImagesByRepository(images), [images]);
    const isLoading = !images.length && !lastUpdate;
    const isEmpty = !images.length && !!lastUpdate;

    const pagination = useClientTablePagination();

    const table = useReactTable({
        data: groupedImages,
        columns: getColumnsTableImages(t),
        getRowId: (originalRow: ImageRow) => originalRow.id,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        onRowSelectionChange: setRowSelection,
        onExpandedChange: setExpanded,
        getSubRows: (row) => row.subRows,
        onPaginationChange: pagination.onPaginationChange,
        state: {
            sorting,
            globalFilter,
            rowSelection,
            expanded,
            pagination: pagination.state,
        },
    });

    pagination.clampToPageCount(table.getPageCount());

    const selectedImages = table
        .getSelectedRowModel()
        .flatRows.filter((row) => !row.original.isGroup)
        .map((row) => row.original);

    const selectedImage = selectedImages[0];
    const numberOfSelectedRows = selectedImages.length;

    const handleDeleteAction = () => {
        const imageIds = selectedImages.map((image) => image.id);
        forceRef.current = false;
        openAlertDialog({
            title: t('removeImages'),
            cancelLabel: tCommon('cancel'),
            actionLabel: tCommon('remove'),
            description: (
                <div className={'space-y-4'}>
                    <p>{t('confirmRemoveImages', { count: imageIds.length })}</p>
                    <Label
                        htmlFor={'force-delete-images'}
                        className={
                            'flex cursor-pointer items-center justify-between rounded-lg border border-destructive bg-muted/50 p-3'
                        }
                    >
                        <div className={'space-y-0.5'}>
                            <p className={'font-medium text-destructive text-sm'}>{t('forceDelete')}</p>
                            <p className={'text-xs'}>{t('forceDeleteDescription')}</p>
                        </div>
                        <Switch
                            id="force-delete-images"
                            defaultChecked={false}
                            onCheckedChange={(checked) => (forceRef.current = checked)}
                        />
                    </Label>
                </div>
            ),
            onAction: async () => {
                const result = await onImageAction({
                    imageIds,
                    action: 'delete',
                    force: forceRef.current,
                });
                if (!result?.serverError) {
                    table.resetRowSelection();
                }
            },
        });
    };

    const handleUseAction = () => {
        router.push(`/docker/containers/create?image=${selectedImage?.repoTags[0]}`);
    };

    const isUseDisabled = numberOfSelectedRows !== 1 || !selectedImage?.repoTags.length;

    const getUseTooltipContent = () => {
        if (numberOfSelectedRows === 0) {
            return t('selectImageToUse');
        }
        if (numberOfSelectedRows > 1) {
            return t('selectOnlyOneImage');
        }
        if (!selectedImage?.repoTags.length) {
            return t('noRepositoryTags');
        }
        return;
    };

    return (
        <div className={'mx-5 space-y-3'}>
            <div className={'flex flex-wrap justify-between gap-3'}>
                <Input
                    className={'w-56 shadow-xs'}
                    placeholder={tCommon('searchPlaceholder')}
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <div className={'flex flex-wrap gap-3'}>
                    <Can resource="image" action="pull">
                        <ProtectedAction action="image.pull">
                            <Button
                                variant={'outline'}
                                icon={HardDriveDownload}
                                onClick={() =>
                                    openDialog({
                                        title: tImage('importTitle'),
                                        description: tImage('importDescription'),
                                        content: <ImageImportForm />,
                                    })
                                }
                            >
                                {tImage('import')}
                            </Button>
                        </ProtectedAction>
                        <ProtectedAction action="image.pull">
                            <Button
                                variant={'outline'}
                                icon={Upload}
                                onClick={() =>
                                    openDialog({
                                        title: tImage('loadTitle'),
                                        description: tImage('loadDescription'),
                                        content: <ImageLoadForm />,
                                    })
                                }
                            >
                                {tImage('load')}
                            </Button>
                        </ProtectedAction>
                    </Can>
                    <ProtectedAction action="image.manage">
                        <Button
                            variant={'outline'}
                            icon={Download}
                            onClick={() => downloadImageArchive(selectedImages.map((image) => image.id))}
                            disabled={numberOfSelectedRows === 0 || statusDocker !== 'connected'}
                        >
                            {tImage('save')}
                            {numberOfSelectedRows > 1 && (
                                <Badge variant={'secondary'} className={'rounded-full'}>
                                    {numberOfSelectedRows}
                                </Badge>
                            )}
                        </Button>
                    </ProtectedAction>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <Button
                                    onClick={handleUseAction}
                                    disabled={isUseDisabled || statusDocker !== 'connected'}
                                >
                                    <Play />
                                    {t('use')}
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {getUseTooltipContent() && <TooltipContent>{getUseTooltipContent()}</TooltipContent>}
                    </Tooltip>
                    <ProtectedAction action="image.remove">
                        <Button
                            variant={'destructive'}
                            onClick={handleDeleteAction}
                            disabled={numberOfSelectedRows === 0 || statusDocker !== 'connected'}
                        >
                            <Trash2 />
                            {tCommon('remove')}
                            {numberOfSelectedRows > 1 && (
                                <Badge variant={'secondary'} className={'rounded-full'}>
                                    {numberOfSelectedRows}
                                </Badge>
                            )}
                        </Button>
                    </ProtectedAction>
                </div>
            </div>
            <TableShell
                table={table}
                isLoading={isLoading}
                skeletonRows={5}
                emptyLabel={t('noImagesFound')}
                noResultsLabel={t('noImagesMatchSearch')}
                hasActiveFilters={!isEmpty}
                rowClassName={(row) => cn('h-12', row.original.isGroup && 'bg-muted/30')}
                onRowClick={(image, row) => {
                    if (image.isGroup) {
                        row.toggleExpanded();
                        return;
                    }
                    router.push(`/docker/images/${image.id}`);
                }}
            />

            <TablePagination
                table={table}
                pageSize={pagination.pageSize}
                onPageSizeChange={pagination.setPageSize}
                perPageLabel={t('imagesPerPage')}
                allowAllPageSize
            />
        </div>
    );
}
