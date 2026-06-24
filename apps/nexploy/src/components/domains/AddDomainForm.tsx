'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { addDomain } from '@/actions/domains/addDomain.action';
import { domainFormSchema } from '@workspace/schemas-zod/repository/domain.schema';
import { toast } from 'sonner';
import { DomainFields } from '@/components/domains/DomainFields';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';
import { DialogFooter } from '@workspace/ui/components/dialog.tsx';

export function AddDomainForm() {
    const t = useTranslations('repository.settings.domains');
    const { onSuccess } = useConfirmationDialogStore();

    const { form, handleSubmitWithAction } = useHookFormAction(
        addDomain,
        zodResolver(domainFormSchema),
        {
            formProps: {
                defaultValues: {
                    domain: {
                        host: '',
                        path: '/',
                        internalPath: '/',
                        stripPath: false,
                        https: false,
                    },
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    toast.success(t('created'));
                    if (onSuccess) onSuccess(data);
                },
            },
        },
    );

    const selectedContainer = form.watch('domain.containerName');
    const isSubmitting = form.formState.isSubmitting;

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-4">
                <DomainFields form={form} />
                <DialogFooter>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !selectedContainer}
                        isLoading={isSubmitting}
                    >
                        {t('addDomain')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
