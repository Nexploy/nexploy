'use client';

import { EthernetPort, Trash } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useNetworkStore } from '@/stores/docker/useNetworkStore';
import { CardNetworkDetails } from '@/components/docker/network/cards/CardNetworkDetails';
import { CardNetworkContainers } from '@/components/docker/network/cards/CardNetworkContainers';

import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
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
    const router = useRouter();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const networkName = network?.name || networkId.substring(0, 12);
    const isBuiltin = network ? ['bridge', 'host', 'none'].includes(network.name) : false;
    const hasContainers = (network?.containers?.length || 0) > 0;
    const isDeleteDisabled = isBuiltin || hasContainers;

    const handleRemove = () => {
        openAlertDialog({
            title: tActions('network.removeTitle'),
            description: tActions('network.removeDescription', { name: networkName }),
            cancelLabel: tActions('cancel'),
            actionLabel: tActions('remove'),
            onAction: async () => {
                await onNetworkAction({ networkIds: [networkId], action: 'delete' });
                router.push('/docker/networks');
            },
        });
    };

    const deleteTooltip = isBuiltin
        ? t('cannotDeleteBuiltin')
        : hasContainers
          ? t('cannotDeleteConnected')
          : t('deleteNetwork');

    return (
        <div className="flex h-full flex-1 flex-col gap-5">
            <div className="flex gap-3 px-5">
                <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                    <EthernetPort className="text-primary size-7" />
                </div>
                <div className="mt-3.5 flex flex-1 flex-col">
                    {!network ? (
                        <Skeleton className="h-6 w-40" />
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <h1 className="line-clamp-1 text-3xl font-semibold tracking-tight break-all">
                                    {networkName}
                                </h1>
                            </TooltipTrigger>
                            <TooltipContent className={'max-w-md break-all'}>
                                {networkName}
                            </TooltipContent>
                        </Tooltip>
                    )}
                    <p className="text-muted-foreground text-sm">{t('description')}</p>
                </div>
                <div className="mt-5 gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleRemove}
                                disabled={isDeleteDisabled}
                            >
                                <Trash className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{deleteTooltip}</TooltipContent>
                    </Tooltip>
                </div>
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
