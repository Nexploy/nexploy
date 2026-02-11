import { Card, CardContent } from '@workspace/ui/components/card';
import { Cpu } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';
import { Badge } from '@workspace/ui/components/badge';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';

export function CardExecuteId() {
    const container = useContainerStore((state) => state.container);
    const t = useTranslations('docker.containerExecId');

    if (!container) {
        return <Skeleton className={'h-100 flex-1'} />;
    }

    return (
        <Card>
            <CardHeaderWithIcon icon={Cpu} title={t('title')}>
                <Badge variant="secondary">{container.execIds?.length}</Badge>
            </CardHeaderWithIcon>
            <CardContent>
                <div className="space-y-2">
                    {container.execIds?.map((execId, idx) => (
                        <code key={idx} className="bg-muted/30 block rounded-md p-2 text-xs">
                            {execId}
                        </code>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
