'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { Panel } from '@xyflow/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from 'lucide-react';
import { usePipelineBuilds } from '@/stores/pipeline/usePipelineStore';
import { BuildsPanelItem } from '@/components/pipeline/buildsPanel/BuildsPanelItem';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { cn } from '@workspace/ui/lib/utils';

dayjs.extend(relativeTime);

const COLLAPSED_HEIGHT = 100;
const EXPANDED_HEIGHT = 250;
const ESTIMATED_ITEM_HEIGHT = 48;
const ITEM_GAP = 4;
const OVERSCAN = 6;

export function BuildsPanel() {
    const locale = useLocale();

    const { builds, hasMoreBuilds, isLoadingMoreBuilds, loadMoreBuilds } = usePipelineBuilds();
    const activeBuildId = usePipelineEditorStore((s) => s.activeBuildId);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        import(`dayjs/locale/${locale}`).catch(() => {});
    }, [locale]);

    const virtualizer = useVirtualizer({
        count: builds.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ESTIMATED_ITEM_HEIGHT,
        getItemKey: useCallback((index: number) => builds[index]?.id ?? index, [builds]),
        gap: ITEM_GAP,
        overscan: OVERSCAN,
    });

    const virtualItems = virtualizer.getVirtualItems();
    const lastVisibleIndex = virtualItems[virtualItems.length - 1]?.index ?? -1;

    useEffect(() => {
        if (!hasMoreBuilds || isLoadingMoreBuilds) return;
        if (lastVisibleIndex >= builds.length - 1) loadMoreBuilds();
    }, [lastVisibleIndex, builds.length, hasMoreBuilds, isLoadingMoreBuilds, loadMoreBuilds]);

    if (builds.length === 0) return null;

    return (
        <Panel position="top-left" className="m-0! p-2">
            <div
                ref={scrollRef}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
                style={{ height: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT }}
                className={cn(
                    'nowheel nopan nodrag w-64 overflow-y-auto overscroll-contain',
                    'transition-[height] duration-200 ease-out',
                    '[scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin]',
                )}
            >
                <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                    {virtualItems.map((virtualItem) => {
                        const build = builds[virtualItem.index];
                        if (!build) return null;

                        return (
                            <div
                                key={virtualItem.key}
                                data-index={virtualItem.index}
                                ref={virtualizer.measureElement}
                                className="absolute top-0 left-0 w-full"
                                style={{ transform: `translateY(${virtualItem.start}px)` }}
                            >
                                <BuildsPanelItem
                                    build={build}
                                    isSelected={build.id === activeBuildId}
                                    locale={locale}
                                />
                            </div>
                        );
                    })}
                </div>
                {isLoadingMoreBuilds && (
                    <div className="flex justify-center py-1">
                        <Loader2 className="size-3 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>
        </Panel>
    );
}
