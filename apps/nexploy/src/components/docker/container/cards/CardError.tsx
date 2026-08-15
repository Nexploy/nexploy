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
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                        <Activity className="size-4 text-destructive" />
                    </div>
                    <CardTitle className="text-destructive">{t('title')}</CardTitle>
                </div>
                <code className="block rounded-md bg-destructive/10 p-3 text-sm">{container.error}</code>
            </CardContent>
        </Card>
    );
}
