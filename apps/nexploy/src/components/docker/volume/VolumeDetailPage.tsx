'use client';

import { HardDrive, Trash2 } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useVolumeStore } from '@/stores/docker/useVolumeStore.ts';
import { CardVolumeDetails } from '@/components/docker/volume/cards/CardVolumeDetails';
import { CardVolumeContainers } from '@/components/docker/volume/cards/CardVolumeContainers';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { onVolumeAction } from '@/actions/docker/volume/volumeAction.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider.tsx';
import { NotFoundSSE } from '@/components/shared/NotFoundSSE';
import * as React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip.tsx';
import { StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { cn } from '@workspace/ui/lib/utils.ts';

interface VolumeDetailPageProps {
    volumeName: string;
}

export function VolumeDetailPage({ volumeName }: VolumeDetailPageProps) {
    const volume = useVolumeStore((state) => state.volume);
    const notFound = useVolumeStore((state) => state.notFound);
    const isConnecting = useVolumeStore((state) => state.isConnecting);

    const t = useTranslations('docker.volumeDetail');
    const tActions = useTranslations('docker.dropdownActions');

    const router = useRouter();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const volumeUsed = volume?.usageData?.RefCount;

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

    if (notFound) {
        return (
            <NotFoundSSE
                title={t('notFoundTitle')}
                description={t('notFoundDescription')}
                backLabel={t('backToVolumes')}
            />
        );
    }

    return (
        <BreadcrumbProvider segments={{ volumeName }}>
            <div className="flex h-full flex-1 flex-col gap-5">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <HardDrive className="text-primary size-7" />
                    </div>
                    <div className="mt-3.5 flex flex-1 flex-col">
                        {isConnecting ? (
                            <Skeleton className="h-9 w-40" />
                        ) : (
                            <div
                                className={cn(
                                    'group flex items-center gap-2',
                                    volumeUsed ? 'online' : 'offline',
                                )}
                            >
                                <h1 className="text-3xl font-semibold tracking-tight break-all">
                                    {volumeName}
                                </h1>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <StatusIndicator />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {volumeUsed ? (
                                            <p>{t('volumeUsed')}</p>
                                        ) : (
                                            <p>{t('volumeUnused')}</p>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        )}
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                    <Button
                        className={'mt-5'}
                        icon={Trash2}
                        variant="destructive"
                        size="icon"
                        onClick={handleRemove}
                        disabled={isConnecting}
                    />
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-5 px-5 pb-5">
                        <CardVolumeContainers />
                        <CardVolumeDetails />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </BreadcrumbProvider>
    );
}
