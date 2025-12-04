'use client';

import { authClient } from '@/lib/auth/auth-client';
import { Button } from '@workspace/ui/components/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Plus, X } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';

interface GitProviderCardProps {
    provider: string;
    name: string;
    description: string;
    isConnected: boolean;
    icon: React.ReactNode;
}

export function GitProviderCard({
    provider,
    name,
    description,
    isConnected,
    icon,
}: GitProviderCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleConnect = async () => {
        setIsLoading(true);
        await authClient.linkSocial({
            provider,
            callbackURL: '/integrations',
        });
        setIsLoading(false);
    };

    const handleDeconnect = async () => {
        setIsLoading(true);
        await authClient.unlinkAccount({
            providerId: provider,
        });
        setIsLoading(false);
        router.refresh();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {icon}
                    {name}
                    <Status status={statusMap[isConnected ? 'connected' : 'disconnected'].status}>
                        <StatusIndicator />
                        <StatusLabel>
                            {statusMap[isConnected ? 'connected' : 'disconnected'].label}
                        </StatusLabel>
                    </Status>
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-md border p-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-muted rounded-full p-2">{icon}</div>
                        <div>
                            <p className="font-medium">{name}</p>
                            <p className="text-muted-foreground text-sm">Provider pour {name}</p>
                        </div>
                    </div>
                    {isConnected ? (
                        <Button
                            onClick={handleDeconnect}
                            icon={X}
                            disabled={isLoading}
                            isLoading={isLoading}
                        >
                            Déconnecter
                        </Button>
                    ) : (
                        <Button
                            onClick={handleConnect}
                            icon={Plus}
                            disabled={isLoading}
                            isLoading={isLoading}
                        >
                            Connecter
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
