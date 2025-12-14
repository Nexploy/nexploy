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
import { Cloud, Plus, RefreshCw, X } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { connectCloudflareAction } from '@/actions/cloudflare/connect.action';
import { disconnectCloudflareAction } from '@/actions/cloudflare/disconnect.action';
import { detectPublicIpAction } from '@/actions/network/detectPublicIp.action';
import { toast } from 'sonner';

interface CloudflareIntegrationCardProps {
    isConnected: boolean;
}

export function CloudflareIntegrationCard({ isConnected }: CloudflareIntegrationCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDetectingIp, setIsDetectingIp] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [apiToken, setApiToken] = useState('');
    const [serverIp, setServerIp] = useState('');
    const router = useRouter();

    const handleDetectIp = async () => {
        setIsDetectingIp(true);
        try {
            const result = await detectPublicIpAction();
            if (result?.data?.ip) {
                setServerIp(result.data.ip);
                toast.success(`IP détectée : ${result.data.ip}`);
            } else if (result?.serverError) {
                toast.error(result.serverError);
            }
        } catch {
            toast.error("Échec de la détection automatique de l'IP");
        } finally {
            setIsDetectingIp(false);
        }
    };

    const handleConnect = async () => {
        if (!apiToken.trim()) {
            toast.error('Veuillez entrer un API Token');
            return;
        }

        if (!serverIp.trim()) {
            toast.error("Veuillez entrer l'IP de votre serveur ou la détecter automatiquement");
            return;
        }

        setIsLoading(true);
        try {
            const result = await connectCloudflareAction({ apiToken, serverIp });
            if (result?.serverError) {
                toast.error(result.serverError);
            } else {
                toast.success('Cloudflare connecté avec succès');
                setIsDialogOpen(false);
                setApiToken('');
                setServerIp('');
                router.refresh();
            }
        } catch {
            toast.error('Échec de la connexion. Vérifiez vos informations.');
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="serverIp">IP publique du serveur</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="serverIp"
                                        type="text"
                                        placeholder="xxx.xxx.xxx.xxx"
                                        value={serverIp}
                                        onChange={(e) => setServerIp(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === 'Enter' &&
                                                apiToken.trim() &&
                                                serverIp.trim()
                                            ) {
                                                handleConnect();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleDetectIp}
                                        disabled={isDetectingIp}
                                        isLoading={isDetectingIp}
                                        icon={RefreshCw}
                                    >
                                        Détecter
                                    </Button>
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    Utilisée pour créer les enregistrements DNS de type A
                                </p>
                            </div>
                            <Button
                                onClick={handleConnect}
                                disabled={isLoading || !apiToken.trim() || !serverIp.trim()}
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
