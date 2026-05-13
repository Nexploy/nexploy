import { Card, CardContent } from '@workspace/ui/components/card';
import { Network, Plus } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import { NetworkForm } from '@/components/docker/container/forms/NetworkForm';
import { useTranslations } from 'next-intl';
import { NetworkItem } from './NetworkItem';
import { useIsSwarmContainer } from '@/hooks/useIsSwarmContainer';

export function CardNetworkDetails() {
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);

    const { openDialog } = useConfirmationDialogStore();
    const networkChanges = useContainerChangesStore((state) => state.networkChanges);
    const isSwarmContainer = useIsSwarmContainer();
    const t = useTranslations('docker.containerNetworks');

    const handleOpenDialog = () => {
        openDialog({
            closeOnBackground: true,
            title: t('addTitle'),
            description: t('addDescription'),
            props: {
                className: 'sm:max-w-[425px]',
            },
            content: <NetworkForm />,
        });
    };

    if (isConnecting) {
        return <Skeleton className="h-100 flex-1" />;
    }

    const addedNetworks = networkChanges.filter((change) => change.typeAction === 'add');
    const networkCount =
        (Object.keys(container?.network.networks ?? {}).length ?? 0) + addedNetworks.length;

    return (
        <Card>
            <CardHeaderWithIcon icon={Network} title={t('title')} className={'justify-between'}>
                {!isSwarmContainer && (
                    <Button className="size-9 md:size-fit" icon={Plus} onClick={handleOpenDialog}>
                        <span className="hidden md:flex">{t('add')}</span>
                    </Button>
                )}
            </CardHeaderWithIcon>
            <CardContent className="px-0">
                {!networkCount ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('noNetworks')}
                    </div>
                ) : (
                    <ScrollAreaWithShadow
                        colorShadow="from-card via-card/50"
                        bottomShadow
                        className="h-90 overflow-hidden px-6"
                    >
                        <div className="space-y-4">
                            {Object.entries(container?.network.networks ?? {}).map(
                                ([networkName, networkInfo]) => (
                                    <NetworkItem
                                        key={networkName}
                                        networkName={networkName}
                                        networkInfo={networkInfo}
                                    />
                                ),
                            )}

                            {addedNetworks.map(({ name }, idx) => (
                                <NetworkItem
                                    key={`new-${idx}`}
                                    networkName={name!}
                                    networkInfo={{
                                        ipAddress: '',
                                        gateway: '',
                                        macAddress: '',
                                        ipPrefixLen: 0,
                                        endpointId: '',
                                    }}
                                    isNew
                                />
                            ))}
                        </div>
                    </ScrollAreaWithShadow>
                )}
            </CardContent>
        </Card>
    );
}
