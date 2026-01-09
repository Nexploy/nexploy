import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { Network, Plus, Trash2, X } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { Button } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import { NetworkForm } from '@/components/docker/container/forms/NetworkForm';
import { useTranslations } from 'next-intl';

interface NetworkItemProps {
    networkName: string;
    networkInfo: {
        ipAddress: string;
        gateway: string;
        macAddress: string;
        ipPrefixLen: number;
        globalIPv6Address?: string;
        ipv6Gateway?: string;
        endpointId: string;
    };
    isDeleted: boolean;
    isNew?: boolean;
    onDelete: () => void;
    onCancelDelete: () => void;
}

function NetworkItem({
    networkName,
    networkInfo,
    isDeleted,
    isNew,
    onDelete,
    onCancelDelete,
}: NetworkItemProps) {
    const t = useTranslations('docker.containerNetworks');
    const statusIndicator = isNew ? (
        <span className="text-green-500">+</span>
    ) : isDeleted ? (
        <span className="text-destructive">-</span>
    ) : null;

    return (
        <div className="bg-muted/30 space-y-3 rounded-lg p-4">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary rounded px-2 py-1 text-sm font-semibold">
                        {networkName}
                    </span>
                    {statusIndicator}
                </div>
                {isDeleted ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={onCancelDelete}
                            >
                                <X />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('cancelDisconnect')}</TooltipContent>
                    </Tooltip>
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="destructiveGhost"
                                className="h-6 w-6"
                                onClick={onDelete}
                            >
                                <Trash2 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('disconnect')}</TooltipContent>
                    </Tooltip>
                )}
            </div>
            {networkInfo && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                        <span className="text-muted-foreground">{t('ipAddress')}</span>
                        <code className="bg-background/50 block rounded px-2 py-1">
                            {networkInfo.ipAddress || '—'}
                        </code>
                    </div>
                    <div className="space-y-1">
                        <span className="text-muted-foreground">{t('gateway')}</span>
                        <code className="bg-background/50 block rounded px-2 py-1">
                            {networkInfo.gateway || '—'}
                        </code>
                    </div>
                    <div className="space-y-1">
                        <span className="text-muted-foreground">{t('macAddress')}</span>
                        <code className="bg-background/50 block rounded px-2 py-1">
                            {networkInfo.macAddress || '—'}
                        </code>
                    </div>
                    <div className="space-y-1">
                        <span className="text-muted-foreground">{t('ipPrefix')}</span>
                        <code className="bg-background/50 block rounded px-2 py-1">
                            /{networkInfo.ipPrefixLen || 0}
                        </code>
                    </div>
                    {networkInfo.globalIPv6Address && (
                        <>
                            <div className="col-span-2 space-y-1">
                                <span className="text-muted-foreground">{t('ipv6')}</span>
                                <code className="bg-background/50 block rounded px-2 py-1 break-all">
                                    {networkInfo.globalIPv6Address}
                                </code>
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground">{t('gatewayIpv6')}</span>
                                <code className="bg-background/50 block rounded px-2 py-1">
                                    {networkInfo.ipv6Gateway || '—'}
                                </code>
                            </div>
                        </>
                    )}
                    <div className="col-span-2 space-y-1">
                        <span className="text-muted-foreground">{t('endpointId')}</span>
                        <code className="bg-background/50 block truncate rounded px-2 py-1">
                            {networkInfo.endpointId || '—'}
                        </code>
                    </div>
                </div>
            )}
        </div>
    );
}

export function CardNetworkDetails() {
    const container = useContainerStore((state) => state.container);
    const { openDialog } = useConfirmationDialogStore();
    const { networkChanges, onNetworkChange } = useContainerChangesStore();
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

    const handleDeleteNetwork = (networkName: string) => {
        onNetworkChange({
            typeAction: 'delete',
            currentName: networkName,
        });
    };

    const handleCancelDelete = (networkName: string) => {
        onNetworkChange({
            typeAction: 'add',
            name: networkName,
            currentName: networkName,
        });
    };

    const getNetworkChangeStatus = (networkName: string) => {
        const deleteChange = networkChanges.find(
            (change) => change.typeAction === 'delete' && change.currentName === networkName,
        );

        return {
            isDeleted: !!deleteChange,
        };
    };

    if (!container) {
        return <Skeleton className="h-100 flex-1" />;
    }

    const addedNetworks = networkChanges.filter((change) => change.typeAction === 'add');
    const networkCount =
        Object.keys(container.network.networks).length + addedNetworks.length;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <CardHeaderWithIcon as="div" icon={Network} title={t('title')}>
                        <Badge variant="secondary">{networkCount}</Badge>
                    </CardHeaderWithIcon>
                    <Button
                        className="size-9 md:size-fit"
                        icon={Plus}
                        onClick={handleOpenDialog}
                    >
                        <span className="hidden md:flex">{t('add')}</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                {networkCount > 0 ? (
                    <ScrollAreaWithShadow
                        colorShadow="from-card via-card/50"
                        bottomShadow
                        className="h-90 overflow-hidden px-6"
                    >
                        <div className="space-y-4">
                            {Object.entries(container.network.networks).map(
                                ([networkName, networkInfo]) => {
                                    const { isDeleted } = getNetworkChangeStatus(networkName);

                                    return (
                                        <NetworkItem
                                            key={networkName}
                                            networkName={networkName}
                                            networkInfo={networkInfo}
                                            isDeleted={isDeleted}
                                            onDelete={() => handleDeleteNetwork(networkName)}
                                            onCancelDelete={() => handleCancelDelete(networkName)}
                                        />
                                    );
                                },
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
                                    isDeleted={false}
                                    isNew
                                    onDelete={() => handleDeleteNetwork(name!)}
                                    onCancelDelete={() => handleCancelDelete(name!)}
                                />
                            ))}
                        </div>
                    </ScrollAreaWithShadow>
                ) : (
                    <div className="flex h-90 items-center justify-center pb-24 font-semibold">
                        {t('noNetworks')}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
