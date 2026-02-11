import { Card, CardContent } from '@workspace/ui/components/card';
import { Activity } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import dayjs from 'dayjs';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { Badge } from '@workspace/ui/components/badge';

export function CardHealthDetails() {
    const container = useContainerStore((state) => state.container);
    const t = useTranslations('docker.containerHealth');

    if (!container) {
        return <Skeleton className={'h-100 flex-1'} />;
    }

    return (
        <Card>
            <CardHeaderWithIcon icon={Activity} title={t('title')}>
                <Badge variant="secondary">{container.health?.logs.length}</Badge>
            </CardHeaderWithIcon>
            <CardContent>
                <div className="mb-3 flex gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">{t('status')}</span>
                        <code className="bg-muted/50 rounded px-2 py-1 text-xs">
                            {container.health?.status}
                        </code>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">
                            {t('consecutiveFailures')}
                        </span>
                        <code className="bg-muted/50 rounded px-2 py-1 text-xs">
                            {container.health?.failingStreak}
                        </code>
                    </div>
                </div>
                <ScrollAreaWithShadow
                    colorShadow={'from-card via-card/50'}
                    bottomShadow
                    className="h-64 overflow-hidden"
                >
                    <div className="space-y-2">
                        {container.health?.logs.map((log, idx) => (
                            <div key={idx} className="bg-muted/30 space-y-2 rounded-lg p-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                        {dayjs(log.start).format('DD/MM/YYYY HH:mm:ss')}
                                    </span>
                                    <span
                                        className={`rounded px-2 py-1 font-medium ${
                                            log.exitCode === 0
                                                ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                                                : 'bg-red-500/20 text-red-700 dark:text-red-400'
                                        }`}
                                    >
                                        {t('exit', { code: log.exitCode })}
                                    </span>
                                </div>
                                {log.output && (
                                    <div className="bg-background/50 rounded p-2">
                                        <code className="text-xs break-all">{log.output}</code>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
