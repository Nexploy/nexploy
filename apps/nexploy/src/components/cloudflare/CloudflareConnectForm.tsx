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
import { useTranslations } from 'next-intl';

export function CloudflareConnectForm() {
    const [isDetectingIp, setIsDetectingIp] = useState(false);
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.cloudflare');

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
                    toast.success(t('connectedSuccess'));
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
                toast.success(t('ipDetected', { ip: result.data.ip }));
            } else if (result?.serverError) {
                toast.error(result.serverError);
            }
        } catch {
            toast.error(t('ipDetectionFailed'));
        } finally {
            setIsDetectingIp(false);
        }
    };

    const isSubmitting = action.status === 'executing';

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <ul className="text-muted-foreground list-disc pl-5 text-sm">
                    <li>{t('permissionZoneRead')}</li>
                    <li>{t('permissionDnsEdit')}</li>
                </ul>

                <FormField
                    control={form.control}
                    name="apiToken"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('apiTokenLabel')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder={t('apiTokenPlaceholder')}
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
                            <FormLabel>{t('serverIp')}</FormLabel>
                            <div className="flex gap-2">
                                <FormControl>
                                    <Input type="text" placeholder={t('serverIpPlaceholder')} {...field} />
                                </FormControl>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleDetectIp}
                                    disabled={isDetectingIp}
                                    isLoading={isDetectingIp}
                                    icon={RefreshCw}
                                >
                                    {t('detect')}
                                </Button>
                            </div>
                            <p className="text-muted-foreground text-xs">
                                {t('serverIpDescription')}
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
                        {t('connect')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
