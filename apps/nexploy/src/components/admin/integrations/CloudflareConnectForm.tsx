'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { connectCloudflareAction } from '@/actions/cloudflare/connect.action';
import { cloudflareConnectSchema } from '@workspace/schemas-zod/cloudflare/cloudflare.schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@workspace/ui/components/form';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function CloudflareConnectForm() {
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.cloudflare');
    const tValidation = useTranslations('validation');

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        connectCloudflareAction,
        zodResolver(cloudflareConnectSchema(tValidation)),
        {
            formProps: {
                defaultValues: {
                    displayName: '',
                    apiToken: '',
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
                    name="displayName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('displayName')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('displayNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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

                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
                        {t('add')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
