'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Cloud, Plus, X } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { disconnectCloudflareAction } from '@/actions/cloudflare/disconnect.action';
import { toast } from 'sonner';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { CloudflareConnectForm } from '@/components/cloudflare/CloudflareConnectForm';

interface CloudflareIntegrationCardProps {
    isConnected: boolean;
}

export function CloudflareIntegrationCard({ isConnected }: CloudflareIntegrationCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const { openDialog } = useConfirmationDialogStore();

    const handleOpenDialog = () => {
        openDialog({
            closeOnBackground: true,
            title: 'Connecter Cloudflare',
            description: 'Entrez votre API Token Cloudflare avec les permissions suivantes :',
            props: {
                className: 'sm:max-w-[425px]',
            },
            content: <CloudflareConnectForm />,
        });
    };

    const handleDisconnect = async () => {
        setIsLoading(true);
        try {
            const result = await disconnectCloudflareAction();
            if (result?.serverError) {
                toast.error(result.serverError);
            } else {
                toast.success('Cloudflare déconnecté');
                router.refresh();
            }
        } catch {
            toast.error('Échec de la déconnexion');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
                <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                    <Cloud className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Cloudflare</span>
                        <Status
                            status={statusMap[isConnected ? 'connected' : 'disconnected'].status}
                        >
                            <StatusIndicator />
                            <StatusLabel>
                                {statusMap[isConnected ? 'connected' : 'disconnected'].label}
                            </StatusLabel>
                        </Status>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Gérez vos DNS et domaines automatiquement
                    </p>
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
                    Déconnecter
                </Button>
            ) : (
                <Button icon={Plus} onClick={handleOpenDialog}>
                    Connecter
                </Button>
            )}
        </div>
    );
}
