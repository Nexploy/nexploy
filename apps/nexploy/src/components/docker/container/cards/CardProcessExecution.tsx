import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Settings } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useTranslations } from 'next-intl';
import { Badge } from '@workspace/ui/components/badge.tsx';

export function CardProcessExecution() {
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);

    const t = useTranslations('docker.containerProcess');

    if (isConnecting) {
        return <Skeleton className={'h-90 flex-1'} />;
    }

    const fields = [
        { label: t('path'), value: container?.path },
        ...(container?.args?.length ? [{ label: t('args'), value: container.args.join(' ') }] : []),
        ...(container?.cmd?.length ? [{ label: t('cmd'), value: container.cmd.join(' ') }] : []),
        ...(container?.entrypoint
            ? [
                  {
                      label: t('entrypoint'),
                      value: Array.isArray(container.entrypoint)
                          ? container.entrypoint.join(' ')
                          : container.entrypoint,
                  },
              ]
            : []),
        { label: t('workingDir'), value: container?.workingDir || '—' },
        { label: t('user'), value: container?.user || 'root' },
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Settings className="text-primary size-4" />
                    </div>
                    <CardTitle>{t('title')}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className={'px-0'}>
                {!container?.path ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('noData')}
                    </div>
                ) : (
                    <ScrollAreaWithShadow
                        colorShadow={'from-card via-card/50'}
                        bottomShadow
                        className="h-50 overflow-hidden px-6"
                    >
                        <div className="space-y-3">
                            {fields.map(({ label, value }, index) => (
                                <div
                                    key={label}
                                    className={`grid grid-cols-[auto_1fr] items-center gap-4 ${index < fields.length - 1 ? 'border-b pb-2' : ''}`}
                                >
                                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                                        {label}
                                    </span>
                                    <div className="flex min-w-0 items-center justify-end overflow-hidden">
                                        <Badge
                                            variant="secondary"
                                            className="w-auto max-w-full shrink"
                                        >
                                            <span className="block truncate">{value}</span>
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollAreaWithShadow>
                )}
            </CardContent>
        </Card>
    );
}
