import { Card, CardContent, CardTitle } from '@workspace/ui/components/card';
import { Activity } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { useTranslations } from 'next-intl';

export function CardError() {
    const container = useContainerStore((state) => state.container);
    const t = useTranslations('docker.containerError');

    if (!container?.error) return null;

    return (
        <Card className="border-destructive">
            <CardContent className={'flex flex-col gap-4'}>
                <div className="flex items-center gap-3">
                    <div className="bg-destructive/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Activity className="text-destructive size-4" />
                    </div>
                    <CardTitle className="text-destructive">{t('title')}</CardTitle>
                </div>
                <code className="bg-destructive/10 block rounded-md p-3 text-sm">
                    {container.error}
                </code>
            </CardContent>
        </Card>
    );
}
