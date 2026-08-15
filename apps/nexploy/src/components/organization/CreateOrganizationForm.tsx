'use client';

import { useTranslations } from 'next-intl';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { createOrganizationAction } from '@/actions/organization/createOrganization.action';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrganizationSchema } from '@workspace/schemas-zod/organization/createOrganization.schema';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useOrganizationStore } from '@/stores/organization/useOrganizationStore';

export function CreateOrganizationForm() {
    const t = useTranslations('organization');
    const { closeDialog } = useConfirmationDialogStore();
    const addOrganization = useOrganizationStore((s) => s.addOrganization);

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        createOrganizationAction,
        zodResolver(createOrganizationSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) {
                        addOrganization({
                            id: data.id,
                            name: data.name,
                            slug: data.slug,
                            logo: data.logo ?? null,
                            role: 'owner',
                            canLeave: false,
                            isPersonal: false,
                        });
                    }
                    closeDialog();
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
                                <Input {...field} placeholder={t('namePlaceholder')} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {form.formState.errors.root?.message && (
                    <span className={'mb-4 flex text-destructive text-sm'}>{form.formState.errors.root?.message}</span>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button isLoading={action.isPending} disabled={action.isPending} type="submit">
                        {t('createOrganization')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
