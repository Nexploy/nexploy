'use client';

import { useState } from 'react';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { RefreshCw } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { connectCloudflareAction } from '@/actions/cloudflare/connect.action';
import { detectPublicIpAction } from '@/actions/network/detectPublicIp.action';
import { cloudflareConnectSchema } from '@workspace/schemas-zod/cloudflare/cloudflare.schema';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { toast } from 'sonner';

export function CloudflareConnectForm() {
    const [isDetectingIp, setIsDetectingIp] = useState(false);
    const { closeDialog } = useConfirmationDialogStore();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        connectCloudflareAction,
        zodResolver(cloudflareConnectSchema),
        {
            formProps: {
                defaultValues: {
                    apiToken: '',
                    serverIp: '',
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success('Cloudflare connecté avec succès');
                    closeDialog();
                },
            },
        },
    );

    const handleDetectIp = async () => {
        setIsDetectingIp(true);
        try {
            const result = await detectPublicIpAction();
            if (result?.data?.ip) {
                form.setValue('serverIp', result.data.ip);
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

    const isSubmitting = action.status === 'executing';

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <ul className="text-muted-foreground list-disc pl-5 text-sm">
                    <li>Zone.Zone: Read</li>
                    <li>Zone.DNS: Edit</li>
                </ul>

                <FormField
                    control={form.control}
                    name="apiToken"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>API Token</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="Votre API Token Cloudflare"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="serverIp"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>IP publique du serveur</FormLabel>
                            <div className="flex gap-2">
                                <FormControl>
                                    <Input type="text" placeholder="xxx.xxx.xxx.xxx" {...field} />
                                </FormControl>
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
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                        className="w-full"
                    >
                        Connecter
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
