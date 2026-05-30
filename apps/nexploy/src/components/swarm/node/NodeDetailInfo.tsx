'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Server } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useTranslations } from 'next-intl';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import CopyButton from '@/components/shared/CopyButton';
import { Badge } from '@workspace/ui/components/badge';
import { ReactNode } from 'react';
import dayjs from 'dayjs';
import { useSwarmNodeStore } from '@/stores/docker/useSwarmNodeStore.ts';
import { Skeleton } from '@workspace/ui/components/skeleton.tsx';

export function NodeDetailInfo() {
    const t = useTranslations('swarm');

    const node = useSwarmNodeStore((s) => s.node);
    const isConnecting = useSwarmNodeStore((s) => s.isConnecting);

    if (!node || isConnecting) {
        return <Skeleton className={'h-80 flex-1'} />;
    }

    const fields: { label: string; value: ReactNode; hasCopy?: boolean; copyText?: string }[] = [
        { label: t('node.nodeId'), value: node.id, hasCopy: true, copyText: node.id },
        { label: t('hostname'), value: node.hostname },
        { label: t('node.version'), value: String(node.version) },
        {
            label: t('role'),
            value: (
                <Badge
                    variant={node.role === 'manager' ? 'default' : 'secondary'}
                    className="capitalize"
                >
                    {node.role}
                    {node.managerStatus?.leader && ' · leader'}
                </Badge>
            ),
        },
        {
            label: t('availability'),
            value: (
                <Badge variant="outline" className="capitalize">
                    {node.availability}
                </Badge>
            ),
        },
        { label: t('address'), value: node.address, hasCopy: true, copyText: node.address },
        { label: t('engine'), value: node.engineVersion },
        ...(node.managerStatus
            ? [
                  {
                      label: t('node.managerReachability'),
                      value: (
                          <Badge
                              variant={
                                  node.managerStatus.reachability === 'reachable'
                                      ? 'default'
                                      : 'destructive'
                              }
                              className="capitalize"
                          >
                              {node.managerStatus.leader
                                  ? `${node.managerStatus.reachability} · leader`
                                  : node.managerStatus.reachability}
                          </Badge>
                      ),
                  },
                  {
                      label: t('node.managerAddr'),
                      value: node.managerStatus.addr,
                      hasCopy: true,
                      copyText: node.managerStatus.addr,
                  },
              ]
            : []),
        { label: t('node.platform'), value: `${node.platform.os} / ${node.platform.architecture}` },
        { label: t('node.createdAt'), value: dayjs(node.createdAt).format('DD/MM/YYYY HH:mm:ss') },
        { label: t('node.updatedAt'), value: dayjs(node.updatedAt).format('DD/MM/YYYY HH:mm:ss') },
    ];

    return (
        <Card>
            <CardHeaderWithIcon icon={Server} title={t('node.infoTitle')} />
            <CardContent className="px-0">
                <ScrollAreaWithShadow
                    colorShadow="from-card via-card/50"
                    bottomShadow
                    className="h-60 overflow-hidden px-6"
                >
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div
                                key={index}
                                className={`grid grid-cols-[auto_1fr] items-center gap-4 ${index < fields.length - 1 ? 'border-b pb-2' : ''}`}
                            >
                                <span className="text-muted-foreground text-sm whitespace-nowrap">
                                    {field.label}
                                </span>
                                <div className="flex min-w-0 items-center justify-end gap-1">
                                    <div className="flex min-w-0 flex-1 justify-end overflow-hidden">
                                        {typeof field.value === 'string' ? (
                                            <Badge
                                                variant="secondary"
                                                className="w-auto max-w-full shrink"
                                            >
                                                <span className="block truncate">
                                                    {field.value}
                                                </span>
                                            </Badge>
                                        ) : (
                                            field.value
                                        )}
                                    </div>
                                    {field.hasCopy && (
                                        <CopyButton
                                            text={field.copyText ?? ''}
                                            className="size-6 shrink-0"
                                            size="icon"
                                            variant="ghost"
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
