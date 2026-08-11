'use client';

import dayjs from 'dayjs';
import { KeyRound, Pencil, Server, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import type { BuildRunnerInfo } from '@workspace/typescript-interface/buildRunner/buildRunner';
import { Can } from '@/components/permission/Can';

interface BuildRunnerCardProps {
    runner: BuildRunnerInfo;
    onEdit: (runner: BuildRunnerInfo) => void;
    onRegenerate: (runner: BuildRunnerInfo) => void;
    onDelete: (runner: BuildRunnerInfo) => void;
}

export function BuildRunnerCard({ runner, onEdit, onRegenerate, onDelete }: BuildRunnerCardProps) {
    const t = useTranslations('admin.buildRunners');

    const statusVariant =
        runner.status === 'ONLINE' ? 'default' : runner.status === 'DRAINING' ? 'outline' : 'secondary';

    return (
        <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <Server className="text-primary size-4" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-medium">{runner.name}</span>
                            <Badge variant={statusVariant}>{t(`status.${runner.status}`)}</Badge>
                            {!runner.enabled && <Badge variant="destructive">{t('disabled')}</Badge>}
                        </div>
                        <span className="text-muted-foreground truncate text-xs">
                            {runner.description || t('noDescription')}
                        </span>
                    </div>
                </div>

                <div className="flex shrink-0 gap-2">
                    <Can resource="buildRunner" action="update">
                        <Button
                            variant="outline"
                            size="icon"
                            icon={KeyRound}
                            title={t('regenerateToken')}
                            onClick={() => onRegenerate(runner)}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            icon={Pencil}
                            title={t('edit')}
                            onClick={() => onEdit(runner)}
                        />
                    </Can>
                    <Can resource="buildRunner" action="delete">
                        <Button
                            variant="destructiveOutline"
                            size="icon"
                            icon={Trash2}
                            title={t('delete')}
                            onClick={() => onDelete(runner)}
                        />
                    </Can>
                </div>
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="font-mono">{runner.tokenPrefix}…</span>
                <span>{t('concurrencyValue', { active: runner.activeJobs, max: runner.maxConcurrency })}</span>
                <span>
                    {runner.lastSeenAt
                        ? t('lastSeenAt', { date: dayjs(runner.lastSeenAt).format('DD/MM/YYYY HH:mm') })
                        : t('neverSeen')}
                </span>
                {runner.version && <span>{t('runnerVersion', { version: runner.version })}</span>}
            </div>

            {(runner.labels.length > 0 || runner.platforms.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                    {runner.platforms.map((platform) => (
                        <Badge key={platform} variant="outline">
                            {platform}
                        </Badge>
                    ))}
                    {runner.labels.map((label) => (
                        <Badge key={label} variant="secondary">
                            {label}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
