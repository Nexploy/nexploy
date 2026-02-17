'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { gitlabProviderSchema } from '@workspace/schemas-zod/admin/oauthProvider.schema';
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
import { saveGitLabProviderAction } from '@/actions/admin/saveGitLabProvider.action';

export function OAuthProviderForm() {
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.oauth');

    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        saveGitLabProviderAction,
        zodResolver(gitlabProviderSchema),
        {
            formProps: {
                defaultValues: {
                    provider: 'gitlab' as const,
                    displayName: '',
                    clientId: '',
                    clientSecret: '',
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

    const isSubmitting = action.status === 'executing';

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
                    <li>{t('guide.gitlab.step1')}</li>
                    <li>{t('guide.gitlab.step2', { url: appUrl })}</li>
                    <li>{t('guide.gitlab.step3')}</li>
                </ol>
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
                <DialogFooter>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                        className="w-full"
                    >
                        {t('save')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
