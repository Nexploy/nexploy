'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { List } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import CopyButton from '@/components/shared/CopyButton';
import { useTranslations } from 'next-intl';
import { Network } from '@workspace/typescript-interface/docker/docker.network';
import dayjs from 'dayjs';
import { Badge } from '@workspace/ui/components/badge';

interface CardNetworkDetailsProps {
    network: Network | undefined;
}

export function CardNetworkDetails({ network }: CardNetworkDetailsProps) {
    const t = useTranslations('docker.networkDetails');

    if (!network) {
        return <Skeleton className="h-80" />;
    }

    const labelEntries = Object.entries(network.labels || {});
    const optionEntries = Object.entries(network.options || {});
    const ipamConfigs = network.ipam?.Config || [];

    return (
        <Card>
            <CardHeaderWithIcon icon={List} title={t('title')} />
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('id')}
                        </span>
                        <div className="flex items-center gap-2">
                            <code className="text-muted-foreground max-w-96 truncate text-xs">
                                {network.id}
                            </code>
                            <CopyButton
                                textToCopy={network.id}
                                className="size-6"
                                size="icon"
                                variant="ghost"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('name')}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{network.name}</span>
                            <CopyButton
                                textToCopy={network.name}
                                className="size-6"
                                size="icon"
                                variant="ghost"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('driver')}
                        </span>
                        <Badge variant="secondary" className="font-mono">
                            {network.driver}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('scope')}
                        </span>
                        <Badge variant="outline">{network.scope}</Badge>
                    </div>

                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('internal')}
                        </span>
                        <Badge variant={network.internal ? 'default' : 'secondary'}>
                            {network.internal ? t('yes') : t('no')}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('attachable')}
                        </span>
                        <Badge variant={network.attachable ? 'default' : 'secondary'}>
                            {network.attachable ? t('yes') : t('no')}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('ingress')}
                        </span>
                        <Badge variant={network.ingress ? 'default' : 'secondary'}>
                            {network.ingress ? t('yes') : t('no')}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('enableIPv6')}
                        </span>
                        <Badge variant={network.enableIPv6 ? 'default' : 'secondary'}>
                            {network.enableIPv6 ? t('yes') : t('no')}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('created')}
                        </span>
                        <span className="text-sm">
                            {dayjs.unix(network.created).format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('containers')}
                        </span>
                        <Badge variant={network.containers?.length > 0 ? 'default' : 'secondary'}>
                            {network.containers?.length || 0}
                        </Badge>
                    </div>

                    {ipamConfigs.length > 0 && (
                        <div className="flex gap-4 border-b pb-3">
                            <span className="text-muted-foreground w-32 shrink-0 pt-1 text-sm font-medium">
                                {t('ipam')}
                            </span>
                            <div className="flex-1 space-y-2">
                                {ipamConfigs.map((config) => (
                                    <div
                                        key={`${config.Subnet}-${config.Gateway}`}
                                        className="bg-muted/50 space-y-1 rounded-md p-2"
                                    >
                                        {config.Subnet && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">
                                                    {t('subnet')}:
                                                </span>
                                                <code className="text-xs">{config.Subnet}</code>
                                            </div>
                                        )}
                                        {config.Gateway && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">
                                                    {t('gateway')}:
                                                </span>
                                                <code className="text-xs">{config.Gateway}</code>
                                            </div>
                                        )}
                                        {config.IPRange && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">
                                                    {t('ipRange')}:
                                                </span>
                                                <code className="text-xs">{config.IPRange}</code>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 pt-1 text-sm font-medium">
                            {t('options')}
                        </span>
                        {optionEntries.length ? (
                            <div className="flex-1 overflow-hidden">
                                <table className="w-full">
                                    <tbody>
                                        {optionEntries.map(([key, value]) => (
                                            <tr key={key} className="border-b last:border-b-0">
                                                <td className="text-muted-foreground max-w-80 truncate py-2 pr-4 text-sm">
                                                    {key}
                                                </td>
                                                <td className="truncate py-2 text-sm">{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <span className="text-muted-foreground pt-1 text-sm">
                                {t('noOptions')}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <span className="text-muted-foreground w-32 shrink-0 pt-1 text-sm font-medium">
                            {t('labels')}
                        </span>
                        {labelEntries.length ? (
                            <div className="flex-1 overflow-hidden">
                                <table className="w-full">
                                    <tbody>
                                        {labelEntries.map(([key, value]) => (
                                            <tr key={key} className="border-b last:border-b-0">
                                                <td className="text-muted-foreground max-w-80 truncate py-2 pr-4 text-sm">
                                                    {key}
                                                </td>
                                                <td className="truncate py-2 text-sm">{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <span className="text-muted-foreground pt-1 text-sm">
                                {t('noLabels')}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
