import { Trash2, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { useTranslations } from 'next-intl';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import { useContainerStore } from '@/stores/docker/useContainerStore.ts';

export interface NetworkItemProps {
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
    isNew?: boolean;
}

export function NetworkItem({ networkName, networkInfo, isNew }: NetworkItemProps) {
    const t = useTranslations('docker.containerNetworks');
    const { networkChanges, onNetworkChange } = useContainerChangesStore();
    const isSwarmContainer = useContainerStore((state) => !!state.container?.labels?.['com.docker.swarm.service.id']);

    const isDeleted = networkChanges.some(
        (change) => change.typeAction === 'delete' && change.currentName === networkName,
    );

    const onDelete = () => onNetworkChange({ typeAction: 'delete', currentName: networkName });
    const onCancelDelete = () => onNetworkChange({ typeAction: 'add', name: networkName, currentName: networkName });
    const statusIndicator = isNew ? (
        <span className="text-green-500">+</span>
    ) : isDeleted ? (
        <span className="text-destructive">-</span>
    ) : null;

    return (
        <div className="space-y-3 rounded-lg bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-1 font-semibold text-primary text-sm">
                        {networkName}
                    </span>
                    {statusIndicator}
                </div>
                {!isSwarmContainer &&
                    (isDeleted ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancelDelete}>
                                    <X />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('cancelDisconnect')}</TooltipContent>
                        </Tooltip>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="destructiveGhost" className="h-6 w-6" onClick={onDelete}>
                                    <Trash2 />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('disconnect')}</TooltipContent>
                        </Tooltip>
                    ))}
            </div>
            {networkInfo && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                        <span className="text-muted-foreground">{t('ipAddress')}</span>
                        <code className="block rounded bg-background/50 px-2 py-1">{networkInfo.ipAddress || '—'}</code>
                    </div>
                    <div className="space-y-1">
                        <span className="text-muted-foreground">{t('gateway')}</span>
                        <code className="block rounded bg-background/50 px-2 py-1">{networkInfo.gateway || '—'}</code>
                    </div>
                    <div className="space-y-1">
                        <span className="text-muted-foreground">{t('macAddress')}</span>
                        <code className="block rounded bg-background/50 px-2 py-1">
                            {networkInfo.macAddress || '—'}
                        </code>
                    </div>
                    <div className="space-y-1">
                        <span className="text-muted-foreground">{t('ipPrefix')}</span>
                        <code className="block rounded bg-background/50 px-2 py-1">
                            /{networkInfo.ipPrefixLen || 0}
                        </code>
                    </div>
                    {networkInfo.globalIPv6Address && (
                        <>
                            <div className="col-span-2 space-y-1">
                                <span className="text-muted-foreground">{t('ipv6')}</span>
                                <code className="block break-all rounded bg-background/50 px-2 py-1">
                                    {networkInfo.globalIPv6Address}
                                </code>
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground">{t('gatewayIpv6')}</span>
                                <code className="block rounded bg-background/50 px-2 py-1">
                                    {networkInfo.ipv6Gateway || '—'}
                                </code>
                            </div>
                        </>
                    )}
                    <div className="col-span-2 space-y-1">
                        <span className="text-muted-foreground">{t('endpointId')}</span>
                        <code className="block truncate rounded bg-background/50 px-2 py-1">
                            {networkInfo.endpointId || '—'}
                        </code>
                    </div>
                </div>
            )}
        </div>
    );
}
