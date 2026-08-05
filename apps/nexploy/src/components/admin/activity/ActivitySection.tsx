'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ActivityLogEntry } from '@workspace/typescript-interface/activity';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useActivityStore } from '@/stores/admin/useActivityStore';
import { ActivityTable } from '@/components/admin/activity/ActivityTable';
import { ActivityDetailSheet } from '@/components/admin/activity/ActivityDetailSheet';

export function ActivitySection() {
    const t = useTranslations('admin.activity');
    const tCommon = useTranslations('common');

    const entries = useActivityStore((state) => state.entries);
    const hasMore = useActivityStore((state) => state.hasMore);
    const isLoading = useActivityStore((state) => state.isLoading);
    const isLoadingMore = useActivityStore((state) => state.isLoadingMore);
    const connect = useActivityStore((state) => state.connect);
    const disconnect = useActivityStore((state) => state.disconnect);
    const loadMore = useActivityStore((state) => state.loadMore);

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<ActivityLogEntry | null>(null);

    const debouncedSearch = useDebouncedValue(search);

    useEffect(() => {
        connect();

        return () => disconnect();
    }, [connect, disconnect]);

    return (
        <div className="flex flex-col gap-4">
            <div className="relative w-full max-w-96">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t('filters.searchPlaceholder')}
                    className="pl-8"
                />
            </div>

            <ActivityTable
                entries={entries}
                search={debouncedSearch}
                isLoading={isLoading && entries.length === 0}
                emptyLabel={t('empty')}
                noResultsLabel={tCommon('noResults')}
                onSelect={setSelected}
            />

            {hasMore && (
                <div className="flex justify-center">
                    <Button variant="outline" size="sm" onClick={() => loadMore()} disabled={isLoadingMore}>
                        {isLoadingMore && <Loader2 className="size-4 animate-spin" />}
                        {t('loadMore')}
                    </Button>
                </div>
            )}

            <ActivityDetailSheet entry={selected} onOpenChange={(open) => !open && setSelected(null)} />
        </div>
    );
}
