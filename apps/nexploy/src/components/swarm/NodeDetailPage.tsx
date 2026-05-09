'use client';

import { useSwarmNodeStore } from '@/stores/docker/useSwarmNodeStore';
import { useTranslations } from 'next-intl';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ArrowLeft, MoreHorizontal, Server } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider';
import { NotFoundSSE } from '@/components/shared/NotFoundSSE';
import { NodeDetailInfo } from './node/NodeDetailInfo';
import { NodeDetailTasks } from './node/NodeDetailTasks';
import { NodeDetailLabels } from './node/NodeDetailLabels';
import { DropdownMenu, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import { NodeDropdownActions } from './NodeDropdownActions';
import { NodeDetailStats } from '@/components/swarm/node/NodeDetailStats.tsx';

interface NodeDetailPageProps {
    nodeId: string;
}

export function NodeDetailPage({ nodeId }: NodeDetailPageProps) {
    const t = useTranslations('swarm');

    const node = useSwarmNodeStore((s) => s.node);
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

    return (
        <BreadcrumbProvider segments={{ nodeId: displayName }}>
            <div className="flex h-full flex-1 flex-col gap-5">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Server className="text-primary size-7" />
                    </div>
                    <div className="mt-3.5 flex flex-1 flex-col">
                        {isConnecting ? (
                            <>
                                <Skeleton className="h-8 w-52" />
                                <Skeleton className="mt-1 h-4 w-36" />
                            </>
                        ) : (
                            <div className="flex flex-col">
                                <h1 className="text-3xl font-semibold tracking-tight">
                                    {node?.hostname}
                                </h1>
                                {node && (
                                    <Badge
                                        variant={node.role === 'manager' ? 'default' : 'secondary'}
                                        className="py-0 capitalize"
                                    >
                                        {node.role}
                                        {node.managerStatus?.leader && ' · leader'}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="mt-5 flex shrink-0 gap-2">
                        <Button asChild variant="outline">
                            <Link href="/swarm?tab=nodes">
                                <ArrowLeft className="size-4" />
                                {t('detail.back')}
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={isConnecting || !node}
                                >
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            {node && <NodeDropdownActions node={node} />}
                        </DropdownMenu>
                    </div>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-4 px-5 pb-5">
                        <NodeDetailStats />
                        <NodeDetailInfo />
                        <NodeDetailTasks />
                        <NodeDetailLabels />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </BreadcrumbProvider>
    );
}
