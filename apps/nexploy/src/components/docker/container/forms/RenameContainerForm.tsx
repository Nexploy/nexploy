'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { containerRenameSchema } from '@workspace/schemas-zod/docker/container/containerAction.schema';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogClose, DialogFooter } from '@workspace/ui/components/dialog';
import { onContainerRenameAction } from '@/actions/docker/container/containerRename.action';
import { useTranslations } from 'next-intl';

interface RenameContainerFormProps {
    containerId: string;
    currentName: string;
}

export function RenameContainerForm({ containerId, currentName }: RenameContainerFormProps) {
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('docker.renameContainer');

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        onContainerRenameAction,
        zodResolver(containerRenameSchema),
        {
            formProps: {
                defaultValues: {
                    containerId,
                    name: currentName,
                },
            },
            actionProps: {
                onSuccess: () => closeDialog(),
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
                            <FormLabel>{t('nameLabel')}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={t('namePlaceholder')}
                                    disabled={form.formState.isSubmitting}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            {t('cancel')}
                        </Button>
                    </DialogClose>
                    <Button type="submit" isLoading={action.isPending}>
                        {t('rename')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
