'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateRegistrySchema } from '@workspace/schemas-zod/registry/registry.schema';
import { updateRegistryAction } from '@/actions/registry/updateRegistry.action';
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
import type { RegistryInfo } from '@/services/registry.service';

interface EditRegistryFormProps {
    registry: RegistryInfo;
}

export function EditRegistryForm({ registry }: EditRegistryFormProps) {
    const { onSuccess } = useConfirmationDialogStore();
    const t = useTranslations('admin.registry');
    const tCommon = useTranslations('common');
    const tValidation = useTranslations('validation');

    const { form, handleSubmitWithAction } = useHookFormAction(
        updateRegistryAction,
        zodResolver(updateRegistrySchema(tValidation)),
        {
            formProps: {
                defaultValues: {
                    id: registry.id,
                    name: registry.name,
                    url: registry.url,
                    username: registry.username ?? '',
                    password: '',
                },
            },
            actionProps: {
                onSuccess: () => {
                    if (onSuccess) onSuccess();
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
                                    type="password"
                                    placeholder={t('passwordEditPlaceholder')}
                                    disabled={isSubmitting}
                                    {...field}
                                />
                            </FormControl>
                            <p className="text-muted-foreground text-xs">{t('passwordEditHint')}</p>
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
