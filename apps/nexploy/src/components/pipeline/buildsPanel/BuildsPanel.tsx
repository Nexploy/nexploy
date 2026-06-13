'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { Panel } from '@xyflow/react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { usePipelineStore } from '@/stores/pipeline/usePipelineStore';
import { BuildsPanelItem } from '@/components/pipeline/buildsPanel/BuildsPanelItem';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { Loader2 } from 'lucide-react';

dayjs.extend(relativeTime);

export function BuildsPanel() {
    const locale = useLocale();

    const { builds, hasMoreBuilds, isLoadingMoreBuilds, loadMoreBuilds } = usePipelineStore();
    const activeBuildId = usePipelineEditorStore((s) => s.activeBuildId);
    const scrollViewportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        import(`dayjs/locale/${locale}`).catch(() => {});
    }, [locale]);

    useEffect(() => {
        const viewport = scrollViewportRef.current;
        if (!viewport || !hasMoreBuilds) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = viewport;
            if (scrollTop + clientHeight >= scrollHeight - 20) {
                loadMoreBuilds();
            }
        };

        viewport.addEventListener('scroll', handleScroll);
        return () => viewport.removeEventListener('scroll', handleScroll);
    }, [hasMoreBuilds, loadMoreBuilds]);

    if (builds.length === 0) return null;

    return (
        <Panel position="top-left" className="!m-0">
            <ScrollAreaWithShadow
                ref={scrollViewportRef}
                bottomShadow
                className="h-[100px] transition-[height] duration-200 hover:h-[250px]"
            >
                <div className={'m-2 flex flex-col gap-1'}>
                    {builds.map((build) => (
                        <BuildsPanelItem
                            key={build.id}
                            build={build}
                            isSelected={build.id === activeBuildId}
                            locale={locale}
                        />
                    ))}
                    {isLoadingMoreBuilds && (
                        <div className="flex justify-center py-1">
                            <Loader2 className="text-muted-foreground size-3 animate-spin" />
                        </div>
                    )}
                </div>
            </ScrollAreaWithShadow>
        </Panel>
    );
}
