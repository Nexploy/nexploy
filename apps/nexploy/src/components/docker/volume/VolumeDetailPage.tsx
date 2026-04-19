'use client';

import { ArrowLeft, HardDrive, Trash2 } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useVolumeStore } from '@/stores/docker/useVolumeStore';
import { CardVolumeDetails } from '@/components/docker/volume/cards/CardVolumeDetails';
import { CardVolumeContainers } from '@/components/docker/volume/cards/CardVolumeContainers';

import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { onVolumeAction } from '@/actions/docker/volume/volumeAction.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

interface VolumeDetailPageProps {
    volumeName: string;
}

export function VolumeDetailPage({ volumeName }: VolumeDetailPageProps) {
    const volume = useVolumeStore((state) => state.getVolume(volumeName));
    const t = useTranslations('docker.volumeDetail');
    const tActions = useTranslations('docker.dropdownActions');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const handleRemove = () => {
        openAlertDialog({
            title: tActions('volume.removeTitle'),
            description: tActions('volume.removeDescription', { name: volumeName }),
            cancelLabel: tActions('cancel'),
            actionLabel: tActions('remove'),
            onAction: async () => {
                const result = await onVolumeAction({
                    action: 'delete',
                    volumeNames: [volumeName],
                });
                if (result?.data?.deleted.includes(volumeName)) {
                    router.push('/docker/volumes');
                }
            },
        });
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-5 pt-5">
            <div className="flex gap-3 px-5">
                <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                    <HardDrive className="text-primary size-7" />
                </div>
                <div className="flex flex-1 flex-col">
                    {!volume ? (
                        <Skeleton className="h-6 w-40" />
                    ) : (
                        <h1 className="text-3xl leading-none font-semibold tracking-tight break-all">
                            {volumeName}
                        </h1>
                    )}
                    <p className="text-muted-foreground text-sm">{t('description')}</p>
                </div>
                <Button icon={ArrowLeft} variant="outline" onClick={() => router.back()}>
                    {tCommon('back')}
                </Button>
                <Button icon={Trash2} variant="destructive" size="icon" onClick={handleRemove} />
            </div>
            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <div className="flex flex-col gap-5 px-5 pb-5">
                    <CardVolumeDetails volume={volume} />
                    <CardVolumeContainers volumeName={volumeName} isLoading={!volume} />
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
