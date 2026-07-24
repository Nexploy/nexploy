'use client';

import { useTranslations } from 'next-intl';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateOrganizationSchema } from '@workspace/schemas-zod/organization/updateOrganization.schema';
import { updateOrganizationAction } from '@/actions/organization/updateOrganization.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

interface RenameOrganizationFormProps {
    organizationId: string;
    name: string;
}

export function RenameOrganizationForm({ organizationId, name }: RenameOrganizationFormProps) {
    const t = useTranslations('organization');
    const { onSuccess } = useConfirmationDialogStore();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        updateOrganizationAction,
        zodResolver(updateOrganizationSchema),
        {
            formProps: { defaultValues: { organizationId, name } },
            actionProps: {
                onSuccess: () => {
                    if (onSuccess) onSuccess();
                },
            },
        },
    );

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('name')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder={t('namePlaceholder')}
                                    disabled={action.isPending}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {form.formState.errors.root?.message && (
                    <span className={'text-destructive mb-4 flex text-sm'}>
                        {form.formState.errors.root?.message}
                    </span>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button isLoading={action.isPending} disabled={action.isPending} type="submit">
                        {t('settings.save')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
