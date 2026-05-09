import { Card, CardContent } from '@workspace/ui/components/card';
import { Activity } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import dayjs from 'dayjs';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { Badge } from '@workspace/ui/components/badge';

export function CardHealthDetails() {
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);

    const t = useTranslations('docker.containerHealth');

    if (isConnecting) {
        return <Skeleton className={'h-100 flex-1'} />;
    }

    const logs = container?.health?.logs ?? [];

    return (
        <Card>
            <CardHeaderWithIcon icon={Activity} title={t('title')} />
            <CardContent className="px-0">
                {!logs.length ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('noLogs')}
                    </div>
                ) : (
                    <>
                        <div className="mb-3 flex gap-4 px-6">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">{t('status')}</span>
                                <code className="bg-muted/50 rounded px-2 py-1 text-xs">
                                    {container?.health?.status}
                                </code>
                            </div>
                            <span className="text-muted-foreground text-sm whitespace-nowrap">
                                {t('consecutiveFailures')}
                            </span>
                            <div className="flex justify-end">
                                <Badge variant="secondary">
                                    {container?.health?.failingStreak}
                                </Badge>
                            </div>
                        </div>
                        <ScrollAreaWithShadow
                            colorShadow="from-card via-card/50"
                            bottomShadow
                            className="h-60 overflow-hidden px-6"
                        >
                            <div className="space-y-2">
                                {logs.map((log, idx) => (
                                    <div key={idx} className="bg-muted/30 space-y-2 rounded-lg p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-muted-foreground text-xs">
                                                {dayjs(log.start).format('DD/MM/YYYY HH:mm:ss')}
                                            </span>
                                            <Badge
                                                variant={
                                                    log.exitCode === 0 ? 'default' : 'destructive'
                                                }
                                            >
                                                {t('exit', { code: log.exitCode })}
                                            </Badge>
                                        </div>
                                        {log.output && (
                                            <code className="bg-background/50 block rounded p-2 text-xs break-all">
                                                {log.output}
                                            </code>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollAreaWithShadow>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
