'use client';

import { useEffect, useState } from 'react';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import { Volume, VolumeEvent } from '@workspace/typescript-interface/docker/docker.volume';
import { useVolumesStore } from '../../stores/docker/useVolumesStore';
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId.ts';

export function useEnvironmentVolumes(): {
    volumes: Volume[];
    isLoading: boolean;
} {
    const globalVolumes = useVolumesStore((s) => s.volumes);
    const [volumes, setVolumes] = useState<Volume[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const environmentId = usePipelineEnvironmentId();

    useEffect(() => {
        if (!environmentId) return;

        setIsLoading(true);

        const params = { environment: environmentId };
        const unsubscribers: (() => void)[] = [];

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'volumes',
                'initial-state',
                (e) => {
                    const data: VolumeEvent = JSON.parse(e.data);
                    setVolumes(data.volumes || []);
                    setIsLoading(false);
                },
                params,
            ),
        );

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'volumes',
                'volume-added',
                (e) => {
                    const data: VolumeEvent = JSON.parse(e.data);
                    if (!data.volume) return;
                    setVolumes((prev) => [...prev, data.volume!]);
                },
                params,
            ),
        );

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'volumes',
                'volume-updated',
                (e) => {
                    const data: VolumeEvent = JSON.parse(e.data);
                    if (!data.volume) return;
                    setVolumes((prev) =>
                        prev.map((v) => (v.name === data.volume!.name ? data.volume! : v)),
                    );
                },
                params,
            ),
        );

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'volumes',
                'volume-removed',
                (e) => {
                    const data: VolumeEvent = JSON.parse(e.data);
                    if (!data.volumeName) return;
                    setVolumes((prev) => prev.filter((v) => v.name !== data.volumeName));
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
        return { volumes: globalVolumes, isLoading: false };
    }

    return { volumes, isLoading };
}
