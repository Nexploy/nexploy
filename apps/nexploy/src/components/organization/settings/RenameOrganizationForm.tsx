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
import { useRouter } from 'next/navigation';

interface RenameOrganizationFormProps {
    organizationId: string;
    name: string;
}

export function RenameOrganizationForm({ organizationId, name }: RenameOrganizationFormProps) {
    const t = useTranslations('organization');
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        updateOrganizationAction,
        zodResolver(updateOrganizationSchema),
        {
            formProps: { defaultValues: { organizationId, name } },
            actionProps: {
                onSuccess: () => router.refresh(),
            },
        },
    );

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="flex items-end gap-3">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormLabel>{t('name')}</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button isLoading={action.isPending} disabled={action.isPending} type="submit">
                    {t('settings.save')}
                </Button>
            </form>
        </Form>
    );
}
