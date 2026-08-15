'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { formatDuration } from '@/utils/time';
import { CATEGORY_HEX } from '@/components/pipeline/pipelineTheme';
import type { NodeData } from '@nexploy/nodes/ui/nodeDefinition';
import type { NodeProgressState, NodeSummaryState } from '@workspace/typescript-interface/stores/pipelineStore';

const TONE_CLASS: Record<string, string> = {
    neutral: 'text-foreground',
    positive: 'text-foreground',
    warning: 'text-yellow-500',
    negative: 'text-destructive',
};

function useElapsed(isRunning: boolean, startedAt?: number, durationMs?: number) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!isRunning || startedAt === undefined) return;
        setNow(Date.now());
        const interval = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(interval);
    }, [isRunning, startedAt]);

    if (isRunning && startedAt !== undefined) return Math.max(0, now - startedAt);
    return durationMs;
}

interface NodeRunBodyProps {
    data: NodeData & {
        startedAt?: number;
        progress?: NodeProgressState;
        summary?: NodeSummaryState;
    };
}

export function NodeRunBody({ data }: NodeRunBodyProps) {
    const t = useTranslations('repository.pipeline');
    const categoryHex = CATEGORY_HEX[data.definition.category] ?? '#888';

    const isRunning = data.status === 'running';
    const isFailed = data.status === 'failed';
    const isSkipped = data.status === 'skipped';
    const elapsedMs = useElapsed(isRunning, data.startedAt, data.durationMs);

    const progress = data.progress;
    const summary = data.summary;

    const stepKey = progress ? `nodes.${data.nodeType}.steps.${progress.labelKey}` : undefined;
    const stepLabel = stepKey && t.has(stepKey) ? t(stepKey, progress?.labelValues) : (progress?.labelKey ?? undefined);

    const summaryKey = summary ? `nodes.${data.nodeType}.summary.${summary.key}` : undefined;
    const summaryLabel =
        summary?.text ?? (summaryKey && t.has(summaryKey) ? t(summaryKey, summary?.values) : undefined);

    const showSummary = !isRunning && !!summaryLabel;
    const ratio = progress && progress.total > 0 ? Math.min(1, progress.current / progress.total) : 0;

    const metrics = [
        isRunning && progress ? `${progress.current}/${progress.total}` : null,
        isSkipped ? t('nodeStatus.skipped') : null,
        elapsedMs !== undefined ? formatDuration(elapsedMs) : null,
    ].filter(Boolean) as string[];

    if (!showSummary && !isRunning && metrics.length === 0) return null;

    return (
        <div className={cn('flex w-full flex-col gap-2 pt-1', (isSkipped || data.disabled) && 'opacity-70')}>
            {showSummary && (
                <span
                    className={cn(
                        'text-sm',
                        summary?.tone === 'negative' ? 'line-clamp-2 break-words' : 'truncate',
                        TONE_CLASS[summary?.tone ?? 'neutral'],
                    )}
                >
                    {summaryLabel}
                </span>
            )}
            {isRunning && (
                <>
                    <span className="truncate text-muted-foreground text-sm">
                        {stepLabel ?? t('nodeRun.waiting')}
                        {progress?.detail && <span className="ml-2 text-foreground">{progress.detail}</span>}
                    </span>
                    <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-border/60">
                        <div
                            className={cn(
                                'h-full rounded-full transition-[width] duration-500 ease-out',
                                !progress && 'w-1/3 animate-node-progress-indeterminate',
                            )}
                            style={{
                                width: progress ? `${ratio * 100}%` : undefined,
                                backgroundColor: isFailed ? 'var(--destructive)' : categoryHex,
                            }}
                        />
                    </div>
                </>
            )}
            {metrics.length > 0 && (
                <span className="truncate text-muted-foreground text-xs tabular-nums">{metrics.join(' · ')}</span>
            )}
        </div>
    );
}
