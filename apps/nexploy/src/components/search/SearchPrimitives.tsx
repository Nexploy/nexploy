'use client';

import { cn } from '@workspace/ui/lib/utils';
import type { ContainerState } from '@workspace/typescript-interface/docker/docker.container';

export type BuildStatus =
    | 'QUEUED'
    | 'BUILDING'
    | 'COMPLETED'
    | 'FAILED'
    | 'DEPLOYING'
    | 'CANCELLED';

export interface RepositoryResult {
    id: string;
    name: string;
    repositoryUrl: string;
    gitProvider: string;
    build: Array<{ id: string; status: BuildStatus; numberBuild: number }>;
}

export interface TypeLabels {
    repository: string;
    container: string;
    image: string;
    volume: string;
    network: string;
}

const STATE_DOT: Record<ContainerState, string> = {
    running: 'bg-green-500',
    paused: 'bg-yellow-400',
    restarting: 'bg-orange-400',
    exited: 'bg-red-500',
    dead: 'bg-red-600',
    created: 'bg-gray-400',
};

export function StateDot({ state }: { state: ContainerState }) {
    return (
        <span
            className={cn(
                'inline-block h-2 w-2 shrink-0 rounded-full',
                STATE_DOT[state] ?? 'bg-gray-400',
            )}
        />
    );
}
