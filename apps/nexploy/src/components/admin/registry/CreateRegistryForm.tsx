'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRegistrySchema } from '@workspace/schemas-zod/registry/registry.schema';
import { createRegistryAction } from '@/actions/registry/createRegistry.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export function CreateRegistryForm() {
    const t = useTranslations('admin.registry');
    const tCommon = useTranslations('common');
    const { closeDialog } = useConfirmationDialogStore();

    const { form, handleSubmitWithAction } = useHookFormAction(
        createRegistryAction,
        zodResolver(createRegistrySchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    url: '',
                    username: '',
                    password: '',
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('createSuccess'));
                    closeDialog();
                },
                onError: ({ error }) => {
                    toast.error(error.thrownError?.message);
                },
            },
        },
    );

    const isSubmitting = form.formState.isSubmitting;

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('nameLabel')}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={t('namePlaceholder')}
                                    disabled={isSubmitting}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('urlLabel')}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={t('urlPlaceholder')}
                                    disabled={isSubmitting}
                                    {...field}
                                />
                            </FormControl>
                            <p className="text-muted-foreground text-xs">{t('urlDescription')}</p>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {t('usernameLabel')}
                                <span className="text-muted-foreground text-xs">
                                    {tCommon('optional')}
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={t('usernamePlaceholder')}
                                    disabled={isSubmitting}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {t('passwordLabel')}
                                <span className="text-muted-foreground text-xs">
                                    {tCommon('optional')}
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="password"
                                    placeholder={t('passwordPlaceholder')}
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <p className="text-muted-foreground text-xs">
                                {t('passwordCreateHint')}
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
                        {t('create')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
