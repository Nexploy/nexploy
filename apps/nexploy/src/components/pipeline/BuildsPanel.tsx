'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import { BuildStatus } from 'generated/client';
import { getActiveBuilds } from '@/services/repository.service';

dayjs.extend(relativeTime);

type ActiveBuild = Awaited<ReturnType<typeof getActiveBuilds>>[number];

const STATUS_DOT: Partial<Record<BuildStatus, string>> = {
    QUEUED: 'bg-yellow-500',
    BUILDING: 'bg-blue-500',
};

interface BuildsPanelProps {
    builds: ActiveBuild[];
    activeBuildId: string | undefined;
    onSelect: (buildId: string | undefined) => void;
}

export function BuildsPanel({ builds, activeBuildId, onSelect }: BuildsPanelProps) {
    const locale = useLocale();

    useEffect(() => {
        import(`dayjs/locale/${locale}`).catch(() => {});
    }, [locale]);

    if (builds.length === 0) return null;

    return (
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {builds.map((build) => {
                const isSelected = build.id === activeBuildId;

                return (
                    <Button
                        key={build.id}
                        variant={isSelected ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => onSelect(isSelected ? undefined : build.id)}
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
    );
}
