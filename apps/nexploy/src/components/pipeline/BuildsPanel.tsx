'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import { BuildStatus } from 'generated/client';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { usePipelineContext } from '@/contexts/PipelineContext';

dayjs.extend(relativeTime);

const STATUS_DOT: Partial<Record<BuildStatus, string>> = {
    DEPLOYING: 'bg-orange-500',
    QUEUED: 'bg-yellow-500',
    BUILDING: 'bg-blue-500',
    COMPLETED: 'bg-green-500',
    FAILED: 'bg-red-500',
    CANCELLED: 'bg-gray-500',
};

export function BuildsPanel() {
    const locale = useLocale();
    const { setActiveBuildId, activeBuilds, activeBuildId } = usePipelineContext();

    useEffect(() => {
        import(`dayjs/locale/${locale}`).catch(() => {});
    }, [locale]);

    if (activeBuilds.length === 0) return null;

    return (
        <div className="absolute z-10">
            <ScrollAreaWithShadow
                bottomShadow
                className="h-[100px] transition-all duration-300 hover:h-[250px]"
            >
                <div className={'m-2 flex flex-col gap-1'}>
                    {activeBuilds.map((build) => {
                        const isSelected = build.id === activeBuildId;

                        return (
                            <Button
                                key={build.id}
                                variant={isSelected ? 'default' : 'secondary'}
                                size="sm"
                                onClick={() => setActiveBuildId(isSelected ? undefined : build.id)}
                                className="h-auto flex-col items-start gap-0.5 px-2.5 py-1.5"
                            >
                                <div className="flex w-full items-center gap-1.5">
                                    <span
                                        className={cn(
                                            'size-1.5 shrink-0 animate-pulse rounded-full',
                                            STATUS_DOT[build.status] ?? 'bg-muted-foreground',
                                        )}
                                    />
                                    <span className="text-xs font-medium">{build.branch}</span>
                                    {build.commitHash && (
                                        <span className="font-mono text-xs opacity-60">
                                            {build.commitHash.slice(0, 6)}
                                        </span>
                                    )}
                                    <span className="ml-auto pl-2 text-xs opacity-60">
                                        {dayjs(build.createdAt).locale(locale).fromNow(true)}
                                    </span>
                                </div>
                                {build.commitMessage && (
                                    <span className="max-w-[200px] truncate text-left text-xs opacity-60">
                                        {build.commitMessage}
                                    </span>
                                )}
                            </Button>
                        );
                    })}
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
