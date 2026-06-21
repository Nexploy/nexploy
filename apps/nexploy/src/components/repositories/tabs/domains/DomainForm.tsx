'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { manageDomains } from '@/actions/repository/manageDomains.action';
import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { domainsFormSchema } from '@workspace/schemas-zod/repository/domain.schema';
import { toast } from 'sonner';
import { DomainFields } from '@/components/repositories/tabs/domains/DomainFields';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';
import type { CloudflareAccountInfo } from '@workspace/typescript-interface/cloudflare/cloudflare';

interface CertOption {
    id: string;
    name: string;
    type: 'LETS_ENCRYPT' | 'CUSTOM';
    domain: string;
}

interface DomainFormProps {
    repositoryId: string;
    domain?: Domain;
    stageId: string | null;
    cloudflareAccounts: CloudflareAccountInfo[];
    certificates: CertOption[];
}

const DEFAULT_NEW_DOMAIN: Partial<Domain> = {
    host: '',
    path: '/',
    internalPath: '/',
    stripPath: false,
    containerPort: 3000,
    https: false,
    certificateId: undefined,
    environmentId: undefined,
    cloudflareZoneId: undefined,
    cloudflareZoneName: undefined,
};

export function DomainForm({
    repositoryId,
    domain,
    stageId,
    cloudflareAccounts,
    certificates,
}: DomainFormProps) {
    const t = useTranslations('repository.settings.domains');
    const { onSuccess } = useConfirmationDialogStore();
    const isEdit = !!domain?.id;

    const bindManageDomains = manageDomains.bind(null, repositoryId);

    const { form, handleSubmitWithAction } = useHookFormAction(
        bindManageDomains,
        zodResolver(domainsFormSchema),
        {
            formProps: {
                defaultValues: {
                    domains: [
                        (domain ?? {
                            ...DEFAULT_NEW_DOMAIN,
                            stageId: stageId ?? undefined,
                        }) as Domain,
                    ],
                    deletedIds: [],
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
                <DomainFields
                    form={form}
                    cloudflareAccounts={cloudflareAccounts}
                    certificates={certificates}
                />
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
                        {isEdit ? t('save') : t('addDomain')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
