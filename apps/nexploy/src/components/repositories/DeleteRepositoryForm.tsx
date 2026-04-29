'use client';

import { useTranslations } from 'next-intl';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { deleteRepositoryAction } from '@/actions/repository/settings/deleteRepository.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { deleteRepositorySchema } from '@workspace/schemas-zod/repository/settings/deleteRepository.schema';

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
    const t = useTranslations('repository.settings.dangerZone');
    const { closeDialog } = useConfirmationDialogStore();

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        deleteRepositoryAction,
        zodResolver(deleteRepositorySchema),
        {
            formProps: {
                defaultValues: {
                    repositoryId,
                    confirmName: '',
                },
            },
            actionProps: {
                onSettled: () => {
                    closeDialog();
                },
            },
        },
    );

    const confirmNameWatch = form.watch('confirmName');

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-4">
                <FormField
                    control={form.control}
                    name="confirmName"
                    render={({ field }) => (
                        <FormItem>
                            <p className="flex items-center text-sm leading-none font-medium">
                                {t.rich('confirmLabel', {
                                    name: repositoryName,
                                    highlight: (chunks) => (
                                        <span className="bg-secondary rounded p-1 px-2 font-mono">
                                            {chunks}
                                        </span>
                                    ),
                                })}
                            </p>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder={repositoryName}
                                    disabled={action.isPending}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            closeDialog();
                            onCancel?.();
                        }}
                        disabled={action.isPending}
                    >
                        {t('cancel')}
                    </Button>
                    <Button
                        type="submit"
                        variant="destructive"
                        isLoading={action.isPending}
                        disabled={action.isPending || confirmNameWatch !== repositoryName}
                    >
                        {t('delete')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
