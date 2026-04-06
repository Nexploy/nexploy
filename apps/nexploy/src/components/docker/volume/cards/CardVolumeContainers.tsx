'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Container } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import Link from 'next/link';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import * as React from 'react';

interface CardVolumeContainersProps {
    volumeName: string;
    isLoading?: boolean;
}

export function CardVolumeContainers({ volumeName, isLoading }: CardVolumeContainersProps) {
    const t = useTranslations('docker.volumeContainers');
    const containers = useContainersStore((state) => state.containers);

    if (isLoading) {
        return <Skeleton className="h-40" />;
    }

    const usingContainers = containers.filter((c) =>
        c.mounts.some((m) => m.type === 'volume' && m.name === volumeName),
    );

    return (
        <Card>
            <CardHeaderWithIcon icon={Container} title={t('title')} />
            <CardContent>
                {usingContainers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('noContainers')}</p>
                ) : (
                    <div className="space-y-2">
                        {usingContainers.map((container) => (
                            <div
                                key={container.id}
                                className="flex items-center gap-2 border-b pb-2 last:border-b-0"
                            >
                                <Link
                                    href={`/docker/containers/${container.id}`}
                                    className="text-primary truncate text-sm hover:underline"
                                >
                                    {container.name}
                                </Link>
                                <Status
                                    status={container.state === 'running' ? 'online' : 'offline'}
                                >
                                    <StatusIndicator />
                                    <StatusLabel>{container.state}</StatusLabel>
                                </Status>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
