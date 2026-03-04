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
import { Table, TableBody, TableCell, TableRow } from '@workspace/ui/components/table';

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
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('id')}
                            </TableCell>
                            <TableCell className="max-w-0">
                                <div className="flex items-center gap-2">
                                    <CopyButton
                                        textToCopy={network.id}
                                        className="size-6"
                                        size="icon"
                                        variant="ghost"
                                    />
                                    <code className="block truncate text-xs">{network.id}</code>
                                </div>
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('name')}
                            </TableCell>
                            <TableCell className="max-w-0 truncate">
                                <code className="text-sm">{network.name}</code>
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('driver')}
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="font-mono">
                                    {network.driver}
                                </Badge>
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('scope')}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{network.scope}</Badge>
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('internal')}
                            </TableCell>
                            <TableCell>
                                <Badge variant={network.internal ? 'default' : 'secondary'}>
                                    {network.internal ? t('yes') : t('no')}
                                </Badge>
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('attachable')}
                            </TableCell>
                            <TableCell>
                                <Badge variant={network.attachable ? 'default' : 'secondary'}>
                                    {network.attachable ? t('yes') : t('no')}
                                </Badge>
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('ingress')}
                            </TableCell>
                            <TableCell>
                                <Badge variant={network.ingress ? 'default' : 'secondary'}>
                                    {network.ingress ? t('yes') : t('no')}
                                </Badge>
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('enableIPv6')}
                            </TableCell>
                            <TableCell>
                                <Badge variant={network.enableIPv6 ? 'default' : 'secondary'}>
                                    {network.enableIPv6 ? t('yes') : t('no')}
                                </Badge>
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('created')}
                            </TableCell>
                            <TableCell className="max-w-0 truncate">
                                {dayjs.unix(network.created).format('YYYY-MM-DD HH:mm:ss')}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 font-medium">
                                {t('containers')}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        network.containers?.length > 0 ? 'default' : 'secondary'
                                    }
                                >
                                    {network.containers?.length || 0}
                                </Badge>
                            </TableCell>
                        </TableRow>

                        {ipamConfigs.length > 0 && (
                            <TableRow>
                                <TableCell className="text-muted-foreground w-32 align-top font-medium">
                                    {t('ipam')}
                                </TableCell>
                                <TableCell className="max-w-0">
                                    <div className="space-y-2">
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
                                                        <code className="text-xs">
                                                            {config.Subnet}
                                                        </code>
                                                    </div>
                                                )}
                                                {config.Gateway && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-muted-foreground">
                                                            {t('gateway')}:
                                                        </span>
                                                        <code className="text-xs">
                                                            {config.Gateway}
                                                        </code>
                                                    </div>
                                                )}
                                                {config.IPRange && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-muted-foreground">
                                                            {t('ipRange')}:
                                                        </span>
                                                        <code className="text-xs">
                                                            {config.IPRange}
                                                        </code>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}

                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 align-top font-medium">
                                {t('options')}
                            </TableCell>
                            <TableCell className="max-w-0">
                                {optionEntries.length ? (
                                    <div className="flex flex-col gap-1">
                                        {optionEntries.map(([key, value]) => (
                                            <div key={key} className="flex gap-2 text-sm">
                                                <span className="text-muted-foreground">{key}</span>
                                                <span className="truncate">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">{t('noOptions')}</span>
                                )}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="text-muted-foreground w-32 align-top font-medium">
                                {t('labels')}
                            </TableCell>
                            <TableCell className="max-w-0">
                                {labelEntries.length ? (
                                    <div className="flex flex-col gap-1">
                                        {labelEntries.map(([key, value]) => (
                                            <div key={key} className="flex gap-2 text-sm">
                                                <span className="text-muted-foreground">{key}</span>
                                                <span className="truncate">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">{t('noLabels')}</span>
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
