'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
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
import { saveGiteaProviderAction } from '@/actions/git/saveGiteaProvider.action';
import { giteaSetupSchema } from '@workspace/schemas-zod/git/giteaSetup.schema';

export function GiteaAppSetupForm() {
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.oauth');

    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        saveGiteaProviderAction,
        zodResolver(giteaSetupSchema),
        {
            formProps: {
                defaultValues: {
                    provider: 'gitea' as const,
                    displayName: '',
                    clientId: '',
                    clientSecret: '',
                    baseUrl: '',
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('saveSuccess'));
                    closeDialog();
                },
                onError: () => {
                    toast.error(t('saveFailed'));
                },
            },
        },
    );

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
                    <li>{t('guide.gitea.step1')}</li>
                    <li>{t('guide.gitea.step2', { url: appUrl })}</li>
                    <li>{t('guide.gitea.step3')}</li>
                </ol>

                <FormField
                    control={form.control}
                    name="baseUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('guide.gitea.baseUrlLabel')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="url"
                                    placeholder={t('guide.gitea.baseUrlPlaceholder')}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('displayName')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    placeholder={t('displayNamePlaceholder')}
                                    {...field}
                                />
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
                            <FormLabel>{t('clientId')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    placeholder={t('clientIdPlaceholder')}
                                    {...field}
                                />
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
                            <FormLabel>{t('clientSecret')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder={t('clientSecretPlaceholder')}
                                    {...field}
                                />
                            </FormControl>
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
                        {t('guide.gitea.createApp')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
