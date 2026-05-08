'use client';

import { useSwarmNodeStore } from '@/stores/docker/useSwarmNodeStore';
import { useTranslations } from 'next-intl';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ArrowLeft, Clock, Server } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider';
import { NotFoundSSE } from '@/components/shared/NotFoundSSE';
import { NodeDetailStats } from './node/NodeDetailStats';
import { NodeDetailInfo } from './node/NodeDetailInfo';
import { NodeDetailTasks } from './node/NodeDetailTasks';
import { NodeDetailLabels } from './node/NodeDetailLabels';
import {
    DropdownMenu,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { NodeDropdownActions } from './NodeDropdownActions';
import { MoreHorizontal } from 'lucide-react';

interface NodeDetailPageProps {
    nodeId: string;
}

function nodeAvailabilityVariant(availability: string): 'default' | 'secondary' | 'destructive' {
    switch (availability) {
        case 'active': return 'default';
        case 'pause': return 'secondary';
        case 'drain': return 'destructive';
        default: return 'secondary';
    }
}

export function NodeDetailPage({ nodeId }: NodeDetailPageProps) {
    const t = useTranslations('swarm');

    const node = useSwarmNodeStore((s) => s.node);
    const tasks = useSwarmNodeStore((s) => s.tasks);
    const notFound = useSwarmNodeStore((s) => s.notFound);
    const isConnecting = useSwarmNodeStore((s) => s.isConnecting);

    const displayName = node?.hostname ?? nodeId.slice(0, 12);

    if (notFound) {
        return (
            <NotFoundSSE
                title={t('node.notFound')}
                description={t('node.notFoundDescription')}
                backLabel={t('detail.back')}
            />
        );
    }

    if (isConnecting) {
        return (
            <BreadcrumbProvider segments={{ nodeId: displayName }}>
                <div className="flex h-full flex-1 flex-col gap-5 pt-5">
                    <div className="flex gap-3 px-5">
                        <Skeleton className="size-12 rounded-lg" />
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-8 w-52" />
                            <Skeleton className="h-4 w-36" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 px-5 md:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                    <div className="space-y-4 px-5">
                        <Skeleton className="h-48" />
                        <Skeleton className="h-64" />
                    </div>
                </div>
            </BreadcrumbProvider>
        );
    }

    if (!node) return null;

    return (
        <BreadcrumbProvider segments={{ nodeId: node.hostname }}>
            <div className="flex h-full flex-1 flex-col gap-5">
                <div className="flex items-start justify-between gap-3 px-5 pt-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Server className="text-primary size-7" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                {node.hostname}
                            </h1>
                            <p className="text-muted-foreground font-mono text-sm">
                                {node.id.slice(0, 12)}
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <Badge variant={node.role === 'manager' ? 'default' : 'secondary'} className="capitalize">
                                {node.role}
                                {node.managerStatus?.leader && ' · leader'}
                            </Badge>
                            <Badge variant={nodeAvailabilityVariant(node.availability)} className="capitalize">
                                {node.availability}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <NodeDropdownActions node={node} />
                        </DropdownMenu>
                        <Button asChild variant="outline">
                            <Link href="/swarm">
                                <ArrowLeft className="size-4" />
                                {t('detail.back')}
                            </Link>
                        </Button>
                    </div>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="space-y-6 px-5 pb-5">
                        <NodeDetailStats node={node} tasks={tasks} />
                        <NodeDetailInfo node={node} />
                        <NodeDetailTasks tasks={tasks} />
                        <NodeDetailLabels labels={node.labels ?? {}} />
                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            <Clock className="size-3" />
                            {t('node.updatedAt')}: {new Date(node.updatedAt).toLocaleString()}
                        </div>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </BreadcrumbProvider>
    );
}
