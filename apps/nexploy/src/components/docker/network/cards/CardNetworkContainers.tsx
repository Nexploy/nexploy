'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Container } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { useNetworkStore } from '@/stores/docker/useNetworkStore.ts';
import Link from 'next/link';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';

export function CardNetworkContainers() {
    const t = useTranslations('docker.networkContainers');
    const network = useNetworkStore((state) => state.network);
    const isConnecting = useNetworkStore((state) => state.isConnecting);
    const getContainer = useContainersStore((state) => state.getContainer);

    if (isConnecting) {
        return <Skeleton className="h-40" />;
    }

    const containerIds = network?.containers || [];

    return (
        <Card>
            <CardHeaderWithIcon icon={Container} title={t('title')} />
            <CardContent>
                {containerIds.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('noContainers')}</p>
                ) : (
                    <div className="space-y-2">
                        {containerIds.map((containerId) => {
                            const container = getContainer(containerId);
                            const displayName = container?.name || containerId.substring(0, 12);

                            return (
                                <div
                                    key={containerId}
                                    className="flex items-center gap-2 border-b pb-2 last:border-b-0"
                                >
                                    <Link
                                        href={`/docker/containers/${containerId}`}
                                        className="text-primary truncate text-sm hover:underline"
                                    >
                                        {displayName}
                                    </Link>
                                    {container?.state && (
                                        <Status
                                            status={
                                                container.state === 'running' ? 'online' : 'offline'
                                            }
                                        >
                                            <StatusIndicator />
                                            <StatusLabel>{container.state}</StatusLabel>
                                        </Status>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
