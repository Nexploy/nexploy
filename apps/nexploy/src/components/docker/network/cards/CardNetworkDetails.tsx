'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { List } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import CopyButton from '@/components/shared/CopyButton';
import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import { Badge } from '@workspace/ui/components/badge';
import { Table, TableBody, TableCell, TableRow } from '@workspace/ui/components/table';
import { useNetworkStore } from '../../../../stores/docker/useNetworkStore';
import { ReactNode, useMemo } from 'react';
import type { Network } from '@workspace/typescript-interface/docker/docker.network';

type RowDef = {
    key: string;
    condition?: (n: Network) => boolean;
    render: (n: Network) => ReactNode;
};

export function CardNetworkDetails() {
    const t = useTranslations('docker.networkDetails');
    const network = useNetworkStore((state) => state.network);
    const isConnecting = useNetworkStore((state) => state.isConnecting);

    const rows = useMemo<RowDef[]>(
        () => [
            {
                key: 'id',
                render: (n) => (
                    <TableRow key="id">
                        <TableCell className="text-muted-foreground w-32 font-medium">
                            {t('id')}
                        </TableCell>
                        <TableCell className="max-w-0">
                            <div className="flex items-center gap-2">
                                <code className="block truncate text-xs">{n.id}</code>
                                <CopyButton
                                    text={n.id}
                                    className="size-6"
                                    size="icon"
                                    variant="ghost"
                                />
                            </div>
                        </TableCell>
                    </TableRow>
                ),
            },
            {
                key: 'name',
                render: (n) => (
                    <TableRow key="name">
                        <TableCell className="text-muted-foreground w-32 font-medium">
                            {t('name')}
                        </TableCell>
                        <TableCell className="max-w-0 truncate">
                            <code className="text-sm">{n.name}</code>
                        </TableCell>
                    </TableRow>
                ),
            },
            {
                key: 'driver',
                render: (n) => (
                    <TableRow key="driver">
                        <TableCell className="text-muted-foreground w-32 font-medium">
                            {t('driver')}
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary" className="font-mono">
                                {n.driver}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ),
            },
            {
                key: 'scope',
                render: (n) => (
                    <TableRow key="scope">
                        <TableCell className="text-muted-foreground w-32 font-medium">
                            {t('scope')}
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">{n.scope}</Badge>
                        </TableCell>
                    </TableRow>
                ),
            },
            ...(['internal', 'attachable', 'ingress', 'enableIPv6'] as const).map((field) => ({
                key: field,
                render: (n: Network) => (
                    <TableRow key={field}>
                        <TableCell className="text-muted-foreground w-32 font-medium">
                            {t(field)}
                        </TableCell>
                        <TableCell>
                            <Badge variant={n[field] ? 'default' : 'secondary'}>
                                {n[field] ? t('yes') : t('no')}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ),
            })),
            {
                key: 'created',
                render: (n) => (
                    <TableRow key="created">
                        <TableCell className="text-muted-foreground w-32 font-medium">
                            {t('created')}
                        </TableCell>
                        <TableCell className="max-w-0 truncate">
                            {dayjs.unix(n.created).format('YYYY-MM-DD HH:mm:ss')}
                        </TableCell>
                    </TableRow>
                ),
            },
            {
                key: 'containers',
                render: (n) => (
                    <TableRow key="containers">
                        <TableCell className="text-muted-foreground w-32 font-medium">
                            {t('containers')}
                        </TableCell>
                        <TableCell>
                            <Badge variant={n.containers?.length > 0 ? 'default' : 'secondary'}>
                                {n.containers?.length || 0}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ),
            },
            {
                key: 'ipam',
                condition: (n) => (n.ipam?.Config?.length ?? 0) > 0,
                render: (n) => (
                    <TableRow key="ipam">
                        <TableCell className="text-muted-foreground w-32 align-top font-medium">
                            {t('ipam')}
                        </TableCell>
                        <TableCell className="max-w-0">
                            <div className="space-y-2">
                                {n.ipam!.Config!.map((config) => (
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
                        </TableCell>
                    </TableRow>
                ),
            },
            {
                key: 'options',
                render: (n) => {
                    const entries = Object.entries(n.options || {});
                    return (
                        <TableRow key="options">
                            <TableCell className="text-muted-foreground w-32 align-top font-medium">
                                {t('options')}
                            </TableCell>
                            <TableCell className="max-w-0">
                                {entries.length ? (
                                    <div className="flex flex-col gap-1">
                                        {entries.map(([k, v]) => (
                                            <div key={k} className="flex gap-2 text-sm">
                                                <span className="text-muted-foreground">{k}</span>
                                                <span className="truncate">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">{t('noOptions')}</span>
                                )}
                            </TableCell>
                        </TableRow>
                    );
                },
            },
            {
                key: 'labels',
                render: (n) => {
                    const entries = Object.entries(n.labels || {});
                    return (
                        <TableRow key="labels">
                            <TableCell className="text-muted-foreground w-32 align-top font-medium">
                                {t('labels')}
                            </TableCell>
                            <TableCell className="max-w-0">
                                {entries.length ? (
                                    <div className="flex flex-col gap-1">
                                        {entries.map(([k, v]) => (
                                            <div key={k} className="flex gap-2 text-sm">
                                                <span className="text-muted-foreground">{k}</span>
                                                <span className="truncate">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">{t('noLabels')}</span>
                                )}
                            </TableCell>
                        </TableRow>
                    );
                },
            },
        ],
        [t],
    );

    if (isConnecting) {
        return <Skeleton className="h-80" />;
    }

    return (
        <Card>
            <CardHeaderWithIcon icon={List} title={t('title')} />
            <CardContent>
                <Table>
                    <TableBody>
                        {network &&
                            rows
                                .filter((row) => !row.condition || row.condition(network))
                                .map((row) => row.render(network))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
