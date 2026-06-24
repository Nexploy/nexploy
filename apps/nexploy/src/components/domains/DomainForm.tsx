'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { editDomain } from '@/actions/domains/editDomain.action';
import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { domainFormSchema } from '@workspace/schemas-zod/repository/domain.schema';
import { toast } from 'sonner';
import { DomainFields } from '@/components/domains/DomainFields';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';

interface DomainFormProps {
    domain?: Domain;
}

export function DomainForm({ domain }: DomainFormProps) {
    const t = useTranslations('repository.settings.domains');
    const { onSuccess } = useConfirmationDialogStore();
    const isEdit = !!domain?.id;

    const { form, handleSubmitWithAction } = useHookFormAction(
        editDomain,
        zodResolver(domainFormSchema),
        {
            formProps: {
                defaultValues: {
                    domain: (domain ?? {
                        host: '',
                        path: '/',
                        internalPath: '/',
                        stripPath: false,
                        containerPort: 3000,
                        https: false,
                    }) as Domain,
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    toast.success(isEdit ? t('updated') : t('created'));
                    if (onSuccess) onSuccess(data);
                },
            },
        },
    );

    const isSubmitting = form.formState.isSubmitting;

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="flex flex-col">
                <DomainFields form={form} />
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
                        {isEdit ? t('save') : t('addDomain')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
