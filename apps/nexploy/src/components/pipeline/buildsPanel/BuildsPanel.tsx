'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Panel } from '@xyflow/react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { BuildsPanelItem } from '@/components/pipeline/buildsPanel/BuildsPanelItem';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';

dayjs.extend(relativeTime);

export function BuildsPanel() {
    const locale = useLocale();

    const { builds } = usePipelineContext();
    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);
    const activeBuildId = usePipelineEditorStore((s) => s.activeBuildId);

    useEffect(() => {
        import(`dayjs/locale/${locale}`).catch(() => {});
    }, [locale]);

    if (builds.length === 0) return null;

    return (
        <Panel position="top-left" className="!m-0">
            <ScrollAreaWithShadow
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
                            onSelect={setActiveBuildId}
                        />
                    ))}
                </div>
            </ScrollAreaWithShadow>
        </Panel>
    );
}
