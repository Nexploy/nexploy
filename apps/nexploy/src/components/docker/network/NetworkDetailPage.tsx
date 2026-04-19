'use client';

import { ArrowLeft, EthernetPort, Trash2 } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useNetworkStore } from '@/stores/docker/useNetworkStore';
import { CardNetworkDetails } from '@/components/docker/network/cards/CardNetworkDetails';
import { CardNetworkContainers } from '@/components/docker/network/cards/CardNetworkContainers';

import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { onNetworkAction } from '@/actions/docker/network/networkAction.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

interface NetworkDetailPageProps {
    networkId: string;
}

export function NetworkDetailPage({ networkId }: NetworkDetailPageProps) {
    const network = useNetworkStore((state) => state.getNetwork(networkId));
    const t = useTranslations('docker.networkDetail');
    const tActions = useTranslations('docker.dropdownActions');
    const tCommon = useTranslations('common');
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

    return (
        <div className="flex h-full flex-1 flex-col gap-5 pt-5">
            <div className="flex gap-3 px-5">
                <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                    <EthernetPort className="text-primary size-7" />
                </div>
                <div className="flex flex-1 flex-col">
                    {!network ? (
                        <Skeleton className="h-6 w-40" />
                    ) : (
                        <h1 className="text-3xl leading-none font-semibold tracking-tight break-all">
                            {networkName}
                        </h1>
                    )}
                    <p className="text-muted-foreground text-sm">{t('description')}</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="size-4" />
                    {tCommon('back')}
                </Button>
                <Button icon={Trash2} variant="destructive" size="icon" onClick={handleRemove} />
            </div>
            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <div className="flex flex-col gap-5 px-5 pb-5">
                    <CardNetworkDetails network={network} />
                    <CardNetworkContainers network={network} />
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
