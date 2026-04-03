'use client';

import { Button } from '@workspace/ui/components/button';
import { Building2, Plus, User, X } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { useTranslations } from 'next-intl';
import { disconnectGitAccountAction } from '@/actions/git/disconnectGitAccount.action';
import Link from 'next/link';
import { Badge } from '@workspace/ui/components/badge';

interface IntegrationCardProps {
    gitProviderId: string;
    provider: string;
    name: string;
    description: string;
    isConnected: boolean;
    icon: React.ReactNode;
    subtitle?: string;
    isOrg?: boolean;
}

export function IntegrationCard({
    gitProviderId,
    name,
    description,
    isConnected,
    icon,
    subtitle,
    isOrg,
}: IntegrationCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const t = useTranslations('common');
    const tStatus = useTranslations('docker.status');

    const handleDisconnect = async () => {
        setIsLoading(true);
        try {
            await disconnectGitAccountAction({ gitProviderId });
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
                        {isOrg ? (
                            <Badge variant="secondary" className="gap-1 text-xs">
                                <Building2 className="size-3" />
                                {subtitle}
                            </Badge>
                        ) : subtitle ? (
                            <Badge variant="outline" className="gap-1 text-xs">
                                <User className="size-3" />
                                {subtitle}
                            </Badge>
                        ) : null}
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
                <Link
                    prefetch={false}
                    href={`/api/git/oauth/connect?gitProviderId=${gitProviderId}`}
                >
                    <Button icon={Plus} disabled={isLoading} isLoading={isLoading}>
                        {t('connect')}
                    </Button>
                </Link>
            )}
        </div>
    );
}
