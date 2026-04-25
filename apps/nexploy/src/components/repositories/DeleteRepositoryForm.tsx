'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { deleteRepositoryAction } from '@/actions/repository/settings/deleteRepository.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

interface DeleteRepositoryFormProps {
    repositoryId: string;
    repositoryName: string;
    onCancel?: () => void;
}

export function DeleteRepositoryForm({
    repositoryId,
    repositoryName,
    onCancel,
}: DeleteRepositoryFormProps) {
    const [confirmName, setConfirmName] = useState('');
    const t = useTranslations('repository.settings.dangerZone');
    const { closeDialog } = useConfirmationDialogStore();

    const { execute, status } = useAction(deleteRepositoryAction, {
        onError: ({ error }) => {
            toast.error(error.serverError || t('deleteError'));
        },
    });

    const isPending = status === 'executing';

    return (
        <div className="flex flex-col gap-4">
            <div>
                <span className="flex items-center text-sm leading-none font-medium">
                    {t.rich('confirmLabel', {
                        name: repositoryName,
                        highlight: (chunks) => (
                            <span className="bg-secondary mx-1 rounded p-1 px-2 font-mono">
                                {chunks}
                            </span>
                        ),
                    })}
                </span>
                <Input
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={repositoryName}
                    className="mt-2"
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={() => {
                        closeDialog();
                        onCancel?.();
                    }}
                    disabled={isPending}
                >
                    {t('cancel')}
                </Button>
                <Button
                    isLoading={isPending}
                    variant="destructive"
                    disabled={confirmName !== repositoryName || isPending}
                    onClick={() => execute({ repositoryId })}
                >
                    {t('delete')}
                </Button>
            </div>
        </div>
    );
}
