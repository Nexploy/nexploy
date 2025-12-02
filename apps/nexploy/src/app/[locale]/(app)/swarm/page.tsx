'use client';

import { Network, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { CardInfoSwarm } from '@/components/swarm/CardInfoSwarm';
import { TableSwarmNodes } from '@/components/swarm/TableSwarmNodes';
import { TableSwarmServices } from '@/components/swarm/TableSwarmServices';
import { SwarmNotActive } from '@/components/swarm/SwarmNotActive';
import { SwarmClusterInfo } from '@/components/swarm/SwarmClusterInfo';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { Button } from '@workspace/ui/components/button';
import { toast } from 'sonner';

const DOCKER_API_URL = process.env.NEXT_PUBLIC_DOCKER_API_URL || 'http://localhost:3300';

export default function SwarmPage() {
    const { connect, disconnect, isSwarmActive } = useSwarmStore();
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch(`${DOCKER_API_URL}/api/swarm/hardRefresh`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to refresh');
            toast.success('Swarm state refreshed');
        } catch (err) {
            toast.error('Failed to refresh swarm state');
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-5 pt-5">
            <div className="flex items-center justify-between px-5">
                <div className="flex gap-3">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Network className="text-primary size-7" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            Docker Swarm
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Gérez votre cluster Docker Swarm
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                >
                    <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {isSwarmActive ? (
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="space-y-8 pb-6">
                        <CardInfoSwarm />
                        <SwarmClusterInfo />
                        <TableSwarmNodes />
                        <TableSwarmServices />
                    </div>
                </ScrollAreaWithShadow>
            ) : (
                <SwarmNotActive />
            )}
        </div>
    );
}
