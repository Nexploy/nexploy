'use client';

import { Container, EthernetPort, FolderGit2, HardDrive, LayoutList } from 'lucide-react';
import { formatBytes } from '@/utils/formatBytes';
import { BuildStatusIcon, StateDot } from './SearchPrimitives';
import type { RepositoryResult, TypeLabels } from './SearchPrimitives';
import type { Containers } from '@workspace/typescript-interface/docker/docker.containers';
import type { Image } from '@workspace/typescript-interface/docker/docker.image';
import type { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import type { Network } from '@workspace/typescript-interface/docker/docker.network';

export function RepositoryRow({
    repo,
    typeLabel,
}: {
    repo: RepositoryResult;
    typeLabel: TypeLabels['repository'];
}) {
    const latestBuild = repo.build[0];
    const cleanUrl = repo.repositoryUrl.replace(/^https?:\/\//, '');

    return (
        <>
            <FolderGit2 className="text-muted-foreground mr-3 h-4 w-4 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{repo.name}</span>
                    {latestBuild && (
                        <div className="flex shrink-0 items-center gap-1">
                            <BuildStatusIcon status={latestBuild.status} />
                            <span className="text-muted-foreground text-xs">
                                #{latestBuild.numberBuild}
                            </span>
                        </div>
                    )}
                </div>
                <span className="text-muted-foreground truncate text-xs">{cleanUrl}</span>
            </div>
            <span className="text-muted-foreground ml-3 shrink-0 text-xs">{typeLabel}</span>
        </>
    );
}

export function ContainerRow({
    container,
    typeLabel,
}: {
    container: Containers;
    typeLabel: TypeLabels['container'];
}) {
    return (
        <>
            <Container className="text-muted-foreground mr-3 h-4 w-4 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">{container.name}</span>
                <span className="text-muted-foreground truncate text-xs">{container.image}</span>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-1.5">
                <StateDot state={container.state} />
                <span className="text-muted-foreground text-xs">{container.state}</span>
            </div>
            <span className="text-muted-foreground ml-3 shrink-0 text-xs">{typeLabel}</span>
        </>
    );
}

export function ImageRow({
    image,
    typeLabel,
}: {
    image: Image;
    typeLabel: TypeLabels['image'];
}) {
    const validTags = image.repoTags?.filter((t) => t !== '<none>:<none>') ?? [];
    const displayName = validTags[0] ?? image.id.slice(0, 12);
    const extra = validTags.length > 1 ? `+${validTags.length - 1} tags` : null;

    return (
        <>
            <LayoutList className="text-muted-foreground mr-3 h-4 w-4 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">{displayName}</span>
                {extra && <span className="text-muted-foreground text-xs">{extra}</span>}
            </div>
            <span className="text-muted-foreground ml-3 shrink-0 text-xs">
                {formatBytes(image.size)}
            </span>
            <span className="text-muted-foreground ml-3 shrink-0 text-xs">{typeLabel}</span>
        </>
    );
}

export function VolumeRow({
    volume,
    typeLabel,
}: {
    volume: Volume;
    typeLabel: TypeLabels['volume'];
}) {
    return (
        <>
            <HardDrive className="text-muted-foreground mr-3 h-4 w-4 shrink-0" />
            <span className="flex-1 truncate text-sm font-medium">{volume.name}</span>
            <span className="text-muted-foreground ml-3 shrink-0 text-xs">{volume.driver}</span>
            <span className="text-muted-foreground ml-3 shrink-0 text-xs">{typeLabel}</span>
        </>
    );
}

export function NetworkRow({
    network,
    typeLabel,
}: {
    network: Network;
    typeLabel: TypeLabels['network'];
}) {
    return (
        <>
            <EthernetPort className="text-muted-foreground mr-3 h-4 w-4 shrink-0" />
            <span className="flex-1 truncate text-sm font-medium">{network.name}</span>
            <span className="text-muted-foreground ml-3 shrink-0 text-xs">{network.driver}</span>
            <span className="text-muted-foreground ml-3 shrink-0 text-xs">{typeLabel}</span>
        </>
    );
}
