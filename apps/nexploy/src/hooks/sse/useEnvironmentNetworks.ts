'use client';

import { useEffect, useState } from 'react';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import { Network, NetworkEvent } from '@workspace/typescript-interface/docker/docker.network';
import { useNetworkStore } from '@/stores/docker/useNetworkStore';
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId.ts';

export function useEnvironmentNetworks(): {
    networks: Network[];
    isLoading: boolean;
} {
    const globalNetworks = useNetworkStore((s) => s.networks);
    const [networks, setNetworks] = useState<Network[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const environmentId = usePipelineEnvironmentId();

    useEffect(() => {
        if (!environmentId) return;

        setIsLoading(true);

        const params = { environment: environmentId };
        const unsubscribers: (() => void)[] = [];

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'networks',
                'initial-state',
                (e) => {
                    const data: NetworkEvent = JSON.parse(e.data);
                    setNetworks(data.networks || []);
                    setIsLoading(false);
                },
                params,
            ),
        );

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'networks',
                'network-added',
                (e) => {
                    const data: NetworkEvent = JSON.parse(e.data);
                    if (!data.network) return;
                    setNetworks((prev) => [...prev, data.network!]);
                },
                params,
            ),
        );

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'networks',
                'network-updated',
                (e) => {
                    const data: NetworkEvent = JSON.parse(e.data);
                    if (!data.network) return;
                    setNetworks((prev) =>
                        prev.map((n) => (n.id === data.network!.id ? data.network! : n)),
                    );
                },
                params,
            ),
        );

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'networks',
                'network-removed',
                (e) => {
                    const data: NetworkEvent = JSON.parse(e.data);
                    if (!data.networkId) return;
                    setNetworks((prev) => prev.filter((n) => n.id !== data.networkId));
                },
                params,
            ),
        );

        return () => {
            unsubscribers.forEach((fn) => fn());
            setIsLoading(false);
        };
    }, [environmentId]);

    if (!environmentId) {
        return { networks: globalNetworks, isLoading: false };
    }

    return { networks, isLoading };
}
