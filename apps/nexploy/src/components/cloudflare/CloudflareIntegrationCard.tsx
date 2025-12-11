'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Label } from '@workspace/ui/components/label';
import { Plus, X, Cloud } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { connectCloudflareAction } from '@/actions/cloudflare/connect.action';
import { disconnectCloudflareAction } from '@/actions/cloudflare/disconnect.action';
import { toast } from 'sonner';

interface CloudflareIntegrationCardProps {
    isConnected: boolean;
}

export function CloudflareIntegrationCard({ isConnected }: CloudflareIntegrationCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [apiToken, setApiToken] = useState('');
    const router = useRouter();

    const handleConnect = async () => {
        if (!apiToken.trim()) {
            toast.error('Veuillez entrer un API Token');
            return;
        }

        setIsLoading(true);
        try {
            const result = await connectCloudflareAction({ apiToken });
            if (result?.serverError) {
                toast.error(result.serverError);
            } else {
                toast.success('Cloudflare connecté avec succès');
                setIsDialogOpen(false);
                setApiToken('');
                router.refresh();
            }
        } catch {
            toast.error('Échec de la connexion. Vérifiez votre API Token.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setIsLoading(true);
        try {
            const result = await disconnectCloudflareAction({});
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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button icon={Plus} disabled={isLoading}>
                            Connecter
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Connecter Cloudflare</DialogTitle>
                            <DialogDescription>
                                Entrez votre API Token Cloudflare avec les permissions suivantes :
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <ul className="text-muted-foreground list-disc pl-5 text-sm">
                                <li>Zone.Zone: Read</li>
                                <li>Zone.DNS: Edit</li>
                            </ul>
                            <div className="space-y-2">
                                <Label htmlFor="apiToken">API Token</Label>
                                <Input
                                    id="apiToken"
                                    type="password"
                                    placeholder="Votre API Token Cloudflare"
                                    value={apiToken}
                                    onChange={(e) => setApiToken(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && apiToken.trim()) {
                                            handleConnect();
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                onClick={handleConnect}
                                disabled={isLoading || !apiToken.trim()}
                                isLoading={isLoading}
                                className="w-full"
                            >
                                Connecter
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
