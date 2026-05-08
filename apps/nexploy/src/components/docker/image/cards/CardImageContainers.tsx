'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Container } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { useImageStore } from '@/stores/docker/useImageStore';
import Link from 'next/link';
import { useMemo } from 'react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';

export function CardImageContainers() {
    const t = useTranslations('docker.imageContainers');
    const image = useImageStore((state) => state.image);
    const isConnecting = useImageStore((state) => state.isConnecting);
    const containers = useContainersStore((state) => state.containers);

    const imageContainers = useMemo(
        () => containers.filter((container) => image && image.repoTags.includes(container.image)),
        [containers, image],
    );

    if (isConnecting) {
        return <Skeleton className="h-40" />;
    }

    return (
        <Card>
            <CardHeaderWithIcon icon={Container} title={t('title')} />
            <CardContent>
                {imageContainers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('noContainers')}</p>
                ) : (
                    <div className="space-y-2">
                        {imageContainers.map((container) => (
                            <Link
                                key={container.id}
                                href={`/docker/containers/${container.id}`}
                                className="flex items-center gap-2 truncate border-b pb-2 last:border-b-0"
                            >
                                <span className="text-primary truncate text-sm hover:underline">
                                    {container.name}
                                </span>
                                <Status
                                    status={container.state === 'running' ? 'online' : 'offline'}
                                >
                                    <StatusIndicator />
                                    <StatusLabel>{container.state}</StatusLabel>
                                </Status>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
