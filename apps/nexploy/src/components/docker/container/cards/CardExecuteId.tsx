import { Card, CardContent } from '@workspace/ui/components/card';
import { Cpu } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';

export function CardExecuteId() {
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);

    const t = useTranslations('docker.containerExecId');

    if (isConnecting) {
        return <Skeleton className={'h-100 flex-1'} />;
    }

    const execIds = container?.execIds ?? [];

    return (
        <Card>
            <CardHeaderWithIcon icon={Cpu} title={t('title')} />
            <CardContent>
                {!execIds.length ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('noExecIds')}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {execIds.map((execId, idx) => (
                            <code
                                key={idx}
                                className="bg-muted/30 block truncate rounded-md p-2 text-xs"
                            >
                                {execId}
                            </code>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
