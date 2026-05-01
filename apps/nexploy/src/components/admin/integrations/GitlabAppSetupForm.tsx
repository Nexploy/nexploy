'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
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
import { saveGitLabProviderAction } from '@/actions/git/saveGitLabProvider.action';
import { gitlabSetupSchema } from '@workspace/schemas-zod/git/gitlabSetup.schema';

export function GitlabAppSetupForm() {
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.oauth');

    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        saveGitLabProviderAction,
        zodResolver(gitlabSetupSchema),
        {
            formProps: {
                defaultValues: {
                    provider: 'gitlab' as const,
                    displayName: '',
                    clientId: '',
                    clientSecret: '',
                    useCustomUrl: false,
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

    const useCustomUrl = form.watch('useCustomUrl');

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
                    name="useCustomUrl"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                            <FormControl>
                                <Switch
                                    className="cursor-pointer"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <FormLabel className="!mt-0 cursor-pointer">
                                {t('guide.gitlab.useCustomUrl')}
                            </FormLabel>
                        </FormItem>
                    )}
                />

                {useCustomUrl && (
                    <FormField
                        control={form.control}
                        name="baseUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('guide.gitlab.customUrlLabel')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="url"
                                        placeholder={t('guide.gitlab.customUrlPlaceholder')}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

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
                        {t('guide.gitlab.createApp')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
