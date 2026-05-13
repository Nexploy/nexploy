import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { Database, Plus } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import { VolumeForm } from '@/components/docker/container/forms/VolumeForm';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import { VolumeItem } from './VolumeItem';
import { useIsSwarmContainer } from '@/hooks/useIsSwarmContainer';

export function CardVolumes() {
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);

    const { openDialog } = useConfirmationDialogStore();
    const { volumeChanges } = useContainerChangesStore();
    const isSwarmContainer = useIsSwarmContainer();
    const t = useTranslations('docker.containerVolumes');

    const handleOpenDialog = () => {
        openDialog({
            closeOnBackground: true,
            title: t('addTitle'),
            description: t('addDescription'),
            props: {
                className: 'sm:max-w-[425px]',
            },
            content: <VolumeForm />,
        });
    };

    if (isConnecting) {
        return <Skeleton className="h-80 flex-2" />;
    }

    const addedVolumes = volumeChanges.filter((change) => change.typeAction === 'add');
    const hasVolumes = (container?.mounts.length ?? 0) > 0 || addedVolumes.length > 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <CardHeaderWithIcon as={'div'} icon={Database} title={t('title')} />
                    {!isSwarmContainer && (
                        <Button
                            className="size-9 md:size-fit"
                            icon={Plus}
                            onClick={() => handleOpenDialog()}
                        >
                            <span className="hidden md:flex">{t('addVolume')}</span>
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-0">
                {!hasVolumes ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('noVolumes')}
                    </div>
                ) : (
                    <ScrollAreaWithShadow
                        colorShadow="from-card via-card/50"
                        bottomShadow
                        className="h-70 overflow-hidden px-6"
                    >
                        <div className="space-y-3">
                            {container?.mounts.map((mount, idx) => (
                                <VolumeItem key={idx} mount={mount} />
                            ))}

                            {addedVolumes.map(({ hostPath, containerPath, readOnly }, idx) => (
                                <VolumeItem
                                    key={`new-${idx}`}
                                    isNew
                                    mount={{
                                        type: 'bind',
                                        source: hostPath!,
                                        destination: containerPath!,
                                        rw: !readOnly,
                                    }}
                                />
                            ))}
                        </div>
                    </ScrollAreaWithShadow>
                )}
            </CardContent>
        </Card>
    );
}
