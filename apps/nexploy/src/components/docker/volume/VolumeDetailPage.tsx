'use client';

import { HardDrive, Trash } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useVolumeStore } from '@/stores/docker/useVolumeStore';
import { CardVolumeDetails } from '@/components/docker/volume/cards/CardVolumeDetails';
import { CardVolumeContainers } from '@/components/docker/volume/cards/CardVolumeContainers';

import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
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
    const router = useRouter();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const handleRemove = () => {
        openAlertDialog({
            title: tActions('volume.removeTitle'),
            description: tActions('volume.removeDescription', { name: volumeName }),
            cancelLabel: tActions('cancel'),
            actionLabel: tActions('remove'),
            onAction: async () => {
                await onVolumeAction({ action: 'delete', volumeNames: [volumeName] });
                router.push('/docker/volumes');
            },
        });
    };

    const isInUse = volume?.usageData?.RefCount && volume.usageData.RefCount > 0;

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
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            {volumeName}
                        </h1>
                    )}
                    <p className="text-muted-foreground text-sm">{t('description')}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleRemove}
                                disabled={!!isInUse}
                            >
                                <Trash className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {isInUse ? t('cannotDeleteInUse') : t('deleteVolume')}
                        </TooltipContent>
                    </Tooltip>
                </div>
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
