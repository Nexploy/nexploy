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
import { createOrganizationAction } from '@/actions/organization/createOrganization.action';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrganizationSchema } from '@workspace/schemas-zod/organization/createOrganization.schema';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useRouter } from 'next/navigation';

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export function CreateOrganizationForm() {
    const t = useTranslations('organization');
    const { closeDialog } = useConfirmationDialogStore();
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        createOrganizationAction,
        zodResolver(createOrganizationSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    slug: '',
                },
            },
            actionProps: {
                onSuccess: () => {
                    closeDialog();
                    router.refresh();
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
                                    onChange={(e) => {
                                        field.onChange(e);
                                        if (!form.formState.dirtyFields.slug) {
                                            form.setValue('slug', slugify(e.target.value));
                                        }
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('slug')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder={t('slugPlaceholder')} />
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
                        {t('createOrganization')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
