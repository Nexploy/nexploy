import { X, Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { useTranslations } from 'next-intl';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';

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

    const isDeleted = networkChanges.some(
        (change) => change.typeAction === 'delete' && change.currentName === networkName,
    );

    const onDelete = () => onNetworkChange({ typeAction: 'delete', currentName: networkName });
    const onCancelDelete = () =>
        onNetworkChange({ typeAction: 'add', name: networkName, currentName: networkName });
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
