'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus, X } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { useTranslations } from 'next-intl';
import { disconnectGitAccountAction } from '@/actions/git/gitAccount.action';

interface IntegrationCardProps {
    provider: string;
    name: string;
    description: string;
    isConnected: boolean;
    icon: React.ReactNode;
}

export function IntegrationCard({
    provider,
    name,
    description,
    isConnected,
    icon,
}: IntegrationCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const t = useTranslations('common');
    const tStatus = useTranslations('docker.status');

    const handleConnect = () => {
        setIsLoading(true);
        window.location.href = `/api/git/oauth/connect?provider=${provider}`;
    };

    const handleDisconnect = async () => {
        setIsLoading(true);
        try {
            await disconnectGitAccountAction({
                provider: provider as 'github' | 'gitlab',
            });
        } finally {
            setIsLoading(false);
            router.refresh();
        }
    };

    return (
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
                <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                    {icon}
                </div>
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{name}</span>
                        <Status
                            status={statusMap[isConnected ? 'connected' : 'disconnected'].status}
                        >
                            <StatusIndicator />
                            <StatusLabel>
                                {tStatus(
                                    statusMap[isConnected ? 'connected' : 'disconnected'].labelKey,
                                )}
                            </StatusLabel>
                        </Status>
                    </div>
                    <p className="text-muted-foreground text-sm">{description}</p>
                </div>
            </div>
            {isConnected ? (
                <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    icon={X}
                    disabled={isLoading}
                    isLoading={isLoading}
                >
                    {t('disconnect')}
                </Button>
            ) : (
                <Button
                    onClick={handleConnect}
                    icon={Plus}
                    disabled={isLoading}
                    isLoading={isLoading}
                >
                    {t('connect')}
                </Button>
            )}
        </div>
    );
}
