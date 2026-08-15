'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { saveAzureReposProviderAction } from '@/actions/git/saveAzureReposProvider.action';
import { azureReposSetupSchema } from '@workspace/schemas-zod/git/azureReposSetup.schema';

export function AzureReposAppSetupForm() {
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.oauth');

    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        saveAzureReposProviderAction,
        zodResolver(azureReposSetupSchema),
        {
            formProps: {
                defaultValues: {
                    displayName: '',
                    clientId: '',
                    clientSecret: '',
                    tenantId: '',
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('saveSuccess'));
                    closeDialog();
                },
            },
        },
    );

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <ol className="list-decimal space-y-1 pl-5 text-muted-foreground text-sm">
                    <li>{t('guide.azureRepos.step1')}</li>
                    <li>{t('guide.azureRepos.step2', { url: appUrl })}</li>
                    <li>{t('guide.azureRepos.step3')}</li>
                    <li>{t('guide.azureRepos.step4')}</li>
                </ol>

                <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('displayName')}</FormLabel>
                            <FormControl>
                                <Input type="text" placeholder={t('displayNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('guide.azureRepos.clientIdLabel')}</FormLabel>
                            <FormControl>
                                <Input type="text" placeholder={t('clientIdPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="clientSecret"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('guide.azureRepos.secretLabel')}</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder={t('clientSecretPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="tenantId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('guide.azureRepos.tenantIdLabel')}</FormLabel>
                            <FormControl>
                                <Input type="text" placeholder={t('guide.azureRepos.tenantIdPlaceholder')} {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                                {t('guide.azureRepos.tenantIdDescription')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={action.isPending}
                        isLoading={action.isPending}
                        className={'self-end'}
                    >
                        {t('guide.azureRepos.createApp')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
