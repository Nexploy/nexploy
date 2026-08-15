'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SortingState } from '@tanstack/react-table';
import type { ActivityLogEntry } from '@workspace/typescript-interface/activity';
import { Input } from '@workspace/ui/components/input';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useActivityStore } from '@/stores/admin/useActivityStore';
import { ServerTable } from '@/components/table/ServerTable';
import { getColumnsActivity } from '@/components/admin/activity/ColumnsActivity';
import { ActivityDetailSheet } from '@/components/admin/activity/ActivityDetailSheet';

const ACTIVITY_ENDPOINT = '/api/admin/activity';
const ACTIVITY_SORTING: SortingState = [{ id: 'createdAt', desc: true }];

export function ActivitySection() {
    const t = useTranslations('admin.activity');
    const tCommon = useTranslations('common');

    const revision = useActivityStore((state) => state.revision);

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<ActivityLogEntry | null>(null);

    const debouncedSearch = useDebouncedValue(search);
    const debouncedRevision = useDebouncedValue(revision, 1000);

    const columns = useMemo(() => getColumnsActivity(t), [t]);

    return (
        <div className="flex flex-col gap-4">
            <div className="relative w-full max-w-96">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t('filters.searchPlaceholder')}
                    className="pl-8"
                />
            </div>

            <ServerTable<ActivityLogEntry>
                endpoint={ACTIVITY_ENDPOINT}
                columns={columns}
                search={debouncedSearch}
                initialSorting={ACTIVITY_SORTING}
                revalidateToken={debouncedRevision}
                allowAllPageSize
                emptyLabel={t('empty')}
                noResultsLabel={tCommon('noResults')}
                renderTotalLabel={(total) => t('total', { count: total })}
                getRowId={(entry) => entry.id}
                onRowClick={setSelected}
            />

            <ActivityDetailSheet entry={selected} onOpenChange={(open) => !open && setSelected(null)} />
        </div>
    );
}
