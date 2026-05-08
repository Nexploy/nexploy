'use client';

import { EthernetPort, Trash2 } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useNetworkStore } from '@/stores/docker/useNetworkStore.ts';
import { CardNetworkDetails } from '@/components/docker/network/cards/CardNetworkDetails';
import { CardNetworkContainers } from '@/components/docker/network/cards/CardNetworkContainers';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { onNetworkAction } from '@/actions/docker/network/networkAction.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider.tsx';
import { NotFoundSSE } from '@/components/shared/NotFoundSSE';

interface NetworkDetailPageProps {
    networkId: string;
}

export function NetworkDetailPage({ networkId }: NetworkDetailPageProps) {
    const network = useNetworkStore((state) => state.network);
    const isConnecting = useNetworkStore((state) => state.isConnecting);
    const notFound = useNetworkStore((state) => state.notFound);

    const t = useTranslations('docker.networkDetail');
    const tActions = useTranslations('docker.dropdownActions');
    const router = useRouter();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const networkName = network?.name || networkId.substring(0, 12);

    const handleRemove = () => {
        openAlertDialog({
            title: tActions('network.removeTitle'),
            description: tActions('network.removeDescription', { name: networkName }),
            cancelLabel: tActions('cancel'),
            actionLabel: tActions('remove'),
            onAction: async () => {
                const result = await onNetworkAction({ networkIds: [networkId], action: 'delete' });
                if (result?.data?.deleted.includes(networkId)) {
                    router.push('/docker/networks');
                }
            },
        });
    };

    if (notFound) {
        return (
            <NotFoundSSE
                title={t('notFoundTitle')}
                description={t('notFoundDescription')}
                backLabel={t('backToNetworks')}
            />
        );
    }

    return (
        <BreadcrumbProvider segments={{ networkId: networkName }}>
            <div className="flex h-full flex-1 flex-col gap-5 pt-5">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <EthernetPort className="text-primary size-7" />
                    </div>
                    <div className="flex flex-1 flex-col">
                        {isConnecting ? (
                            <Skeleton className="h-6 w-40" />
                        ) : (
                            <h1 className="text-3xl leading-none font-semibold tracking-tight break-all">
                                {networkName}
                            </h1>
                        )}
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                    <Button
                        icon={Trash2}
                        variant="destructive"
                        size="icon"
                        onClick={handleRemove}
                        disabled={!network}
                    />
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-5 px-5 pb-5">
                        <CardNetworkContainers />
                        <CardNetworkDetails />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </BreadcrumbProvider>
    );
}
