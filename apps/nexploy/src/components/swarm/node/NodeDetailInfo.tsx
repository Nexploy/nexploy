'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Hash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SwarmNode } from '@workspace/typescript-interface/docker/swarm';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import CopyButton from '@/components/shared/CopyButton';

interface NodeDetailInfoProps {
    node: SwarmNode;
}

function nodeStateToStatus(state: SwarmNode['state']): 'online' | 'offline' | 'degraded' | 'waiting' {
    switch (state) {
        case 'ready': return 'online';
        case 'down': return 'offline';
        case 'disconnected': return 'degraded';
        default: return 'waiting';
    }
}

export function NodeDetailInfo({ node }: NodeDetailInfoProps) {
    const t = useTranslations('swarm');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Hash className="size-4" />
                    {t('node.infoTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-4">
                    <div>
                        <dt className="text-muted-foreground">{t('node.nodeId')}</dt>
                        <dd className="mt-0.5 flex items-center gap-1">
                            <span className="font-mono text-xs">{node.id.slice(0, 12)}</span>
                            <CopyButton textToCopy={node.id} className="size-5" size="icon" variant="ghost" />
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('node.version')}</dt>
                        <dd className="mt-0.5">{node.version}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('role')}</dt>
                        <dd className="mt-0.5">
                            <Badge variant={node.role === 'manager' ? 'default' : 'secondary'} className="capitalize">
                                {node.role}
                            </Badge>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('status')}</dt>
                        <dd className="mt-0.5">
                            <Status className="border-0 p-0" status={nodeStateToStatus(node.state)} variant="outline">
                                <StatusIndicator />
                                <StatusLabel className="capitalize">{node.state}</StatusLabel>
                            </Status>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('availability')}</dt>
                        <dd className="mt-0.5">
                            <Badge variant="outline" className="capitalize">{node.availability}</Badge>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('address')}</dt>
                        <dd className="mt-0.5 flex items-center gap-1">
                            <span className="font-mono text-xs">{node.address}</span>
                            <CopyButton textToCopy={node.address} className="size-5" size="icon" variant="ghost" />
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('engine')}</dt>
                        <dd className="mt-0.5 font-mono text-xs">{node.engineVersion}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('node.platform')}</dt>
                        <dd className="mt-0.5 font-mono text-xs">
                            {node.platform.os} / {node.platform.architecture}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('node.createdAt')}</dt>
                        <dd className="mt-0.5 text-xs">{new Date(node.createdAt).toLocaleString()}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{t('node.updatedAt')}</dt>
                        <dd className="mt-0.5 text-xs">{new Date(node.updatedAt).toLocaleString()}</dd>
                    </div>
                    {node.managerStatus && (
                        <>
                            <div>
                                <dt className="text-muted-foreground">{t('node.managerReachability')}</dt>
                                <dd className="mt-0.5">
                                    <Badge
                                        variant={node.managerStatus.reachability === 'reachable' ? 'default' : 'destructive'}
                                        className="capitalize"
                                    >
                                        {node.managerStatus.leader ? `${node.managerStatus.reachability} · leader` : node.managerStatus.reachability}
                                    </Badge>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">{t('node.managerAddr')}</dt>
                                <dd className="mt-0.5 font-mono text-xs">{node.managerStatus.addr}</dd>
                            </div>
                        </>
                    )}
                </dl>
            </CardContent>
        </Card>
    );
}
