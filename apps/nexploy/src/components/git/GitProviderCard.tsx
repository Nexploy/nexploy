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
import { useState } from 'react';

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

    const handleConnect = async () => {
        try {
            setIsLoading(true);
            await authClient.linkSocial({
                provider,
                callbackURL: '/git',
            });
        } catch (error) {
            console.error('Error connecting to ' + provider, error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeconnect = async () => {
        try {
            setIsLoading(true);
            await authClient.unlinkAccount({
                providerId: provider,
            });
        } catch (error) {
            console.error('Error connecting to ' + provider, error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {icon}
                    {name}
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
