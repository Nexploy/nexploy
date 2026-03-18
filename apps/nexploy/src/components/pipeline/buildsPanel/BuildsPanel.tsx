'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
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
        <div className="absolute z-10">
            <ScrollAreaWithShadow
                bottomShadow
                className="h-[100px] transition-all duration-300 hover:h-[250px]"
            >
                <div className={'m-2 flex flex-col gap-1'}>
                    {builds.map((build, index) => (
                        <BuildsPanelItem
                            key={build.id}
                            build={build}
                            index={index}
                            total={builds.length}
                            isSelected={build.id === activeBuildId}
                            locale={locale}
                            onSelect={setActiveBuildId}
                        />
                    ))}
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
