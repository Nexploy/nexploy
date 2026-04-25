'use client';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { relinkGitAccountAction } from '@/actions/repository/relinkGitAccount.action';
import { relinkGitAccountSchema } from '@workspace/schemas-zod/repository/relinkGitAccount.schema';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DeleteRepositoryForm } from '@/components/repositories/DeleteRepositoryForm';
import { GitAccountFormField } from '@/components/git/GitAccountFormField';

interface ReassociateGitAccountFormProps {
    repositoryId: string;
    repositoryName: string;
    onClose: () => void;
    onReopen: () => void;
}

export function ReassociateGitAccountForm({
    repositoryId,
    repositoryName,
    onClose,
    onReopen,
}: ReassociateGitAccountFormProps) {
    const t = useTranslations('repository.reassociateGitAccount');
    const tSource = useTranslations('repository.steps.gitSource');
    const tDanger = useTranslations('repository.settings.dangerZone');
    const { openDialog } = useConfirmationDialogStore();

    const { form, handleSubmitWithAction } = useHookFormAction(
        relinkGitAccountAction.bind(null, repositoryId),
        zodResolver(relinkGitAccountSchema),
        {
            formProps: {
                defaultValues: { gitAccountId: '' },
            },
            actionProps: {
                onSuccess: () => onClose(),
            },
        },
    );

    const handleOpenDelete = () => {
        onClose();
        openDialog({
            title: tDanger('deleteTitle'),
            description: tDanger('deleteDescription'),
            props: { showCloseButton: false },
            closeOnBackground: false,
            content: (
                <DeleteRepositoryForm
                    repositoryId={repositoryId}
                    repositoryName={repositoryName}
                    onCancel={onReopen}
                />
            ),
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-4 px-6 pb-6">
                <GitAccountFormField
                    noAccountsContent={
                        <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6 text-center text-sm">
                            <span>{tSource('noAccounts')}</span>
                            <Button asChild size="sm" onClick={onClose}>
                                <Link href="/account#integrations">
                                    {tSource('connectAccount')}
                                </Link>
                            </Button>
                        </div>
                    }
                />

                <Button
                    type="submit"
                    isLoading={form.formState.isSubmitting}
                    disabled={form.formState.isSubmitting}
                >
                    {t('save')}
                </Button>

                <div className="flex items-center gap-3">
                    <div className="bg-border h-px flex-1" />
                    <span className="text-muted-foreground text-xs">{t('orDelete')}</span>
                    <div className="bg-border h-px flex-1" />
                </div>

                <Button
                    type="button"
                    variant="destructive"
                    icon={Trash2}
                    onClick={handleOpenDelete}
                >
                    {tDanger('deleteButton')}
                </Button>
            </form>
        </Form>
    );
}
