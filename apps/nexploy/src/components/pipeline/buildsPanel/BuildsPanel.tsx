'use client';

import { useCallback, useRef, useState } from 'react';
import { Panel } from '@xyflow/react';
import { type Rect, type Virtualizer, useVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from 'lucide-react';
import { usePipelineBuilds } from '@/stores/pipeline/usePipelineStore';
import { BuildsPanelItem } from '@/components/pipeline/buildsPanel/BuildsPanelItem';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { useDayjsLocale } from '@/hooks/useDayjsLocale';
import { cn } from '@workspace/ui/lib/utils';

const COLLAPSED_HEIGHT = 100;
const EXPANDED_HEIGHT = 250;
const PANEL_WIDTH = 256;
const ESTIMATED_ITEM_HEIGHT = 48;
const ITEM_GAP = 4;
const OVERSCAN = 3;
const LOAD_MORE_THRESHOLD = 6;

const VIEWPORT_RECT: Rect = { width: PANEL_WIDTH, height: EXPANDED_HEIGHT };

const estimateItemSize = () => ESTIMATED_ITEM_HEIGHT;

const observeViewportRect = (_instance: Virtualizer<HTMLDivElement, HTMLDivElement>, cb: (rect: Rect) => void) => {
    cb(VIEWPORT_RECT);
};

export function BuildsPanel() {
    const locale = useDayjsLocale();

    const { builds, hasMoreBuilds, isLoadingMoreBuilds, loadMoreBuilds } = usePipelineBuilds();
    const activeBuildId = usePipelineEditorStore((s) => s.activeBuildId);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const latest = useRef({ builds, hasMoreBuilds, isLoadingMoreBuilds, loadMoreBuilds });
    latest.current = { builds, hasMoreBuilds, isLoadingMoreBuilds, loadMoreBuilds };

    const getItemKey = useCallback((index: number) => latest.current.builds[index]?.id ?? index, []);

    const handleRangeChange = useCallback((instance: Virtualizer<HTMLDivElement, HTMLDivElement>) => {
        const { builds, hasMoreBuilds, isLoadingMoreBuilds, loadMoreBuilds } = latest.current;
        if (!hasMoreBuilds || isLoadingMoreBuilds) return;
        if ((instance.range?.endIndex ?? -1) >= builds.length - 1 - LOAD_MORE_THRESHOLD) loadMoreBuilds();
    }, []);

    const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
        count: builds.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: estimateItemSize,
        getItemKey,
        observeElementRect: observeViewportRect,
        initialRect: VIEWPORT_RECT,
        gap: ITEM_GAP,
        overscan: OVERSCAN,
        directDomUpdates: true,
        onChange: handleRangeChange,
    });

    const virtualItems = virtualizer.getVirtualItems();

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
                <div ref={virtualizer.containerRef} className="relative w-full">
                    {virtualItems.map((virtualItem) => {
                        const build = builds[virtualItem.index];
                        if (!build) return null;

                        return (
                            <div
                                key={virtualItem.key}
                                data-index={virtualItem.index}
                                ref={virtualizer.measureElement}
                                className="absolute top-0 left-0 w-full"
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
