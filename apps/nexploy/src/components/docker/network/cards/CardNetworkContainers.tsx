'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Container } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import CopyButton from '@/components/utils/CopyButton';
import { useTranslations } from 'next-intl';
import { Network } from '@workspace/typescript-interface/docker/docker.network';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import Link from 'next/link';

interface CardNetworkContainersProps {
    network: Network | undefined;
}

export function CardNetworkContainers({ network }: CardNetworkContainersProps) {
    const t = useTranslations('docker.networkContainers');
    const getContainer = useContainersStore((state) => state.getContainer);

    if (!network) {
        return <Skeleton className="h-40" />;
    }

    const containerIds = network.containers || [];

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
                                    <CopyButton
                                        textToCopy={containerId}
                                        className="size-6"
                                        size="icon"
                                        variant="ghost"
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
