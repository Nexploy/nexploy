'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { ProtectedAction } from '@/components/permission/ProtectedAction';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { imageImportSchema } from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { onImageImportAction } from '@/actions/docker/image/imageImportAction.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

export function ImageImportForm() {
    const t = useTranslations('docker.imageActions');
    const tCommon = useTranslations('common');
    const closeDialog = useConfirmationDialogStore((state) => state.closeDialog);

    const { form, handleSubmitWithAction } = useHookFormAction(onImageImportAction, zodResolver(imageImportSchema), {
        formProps: {
            defaultValues: {
                source: '',
                repo: '',
                tag: 'latest',
            },
        },
        actionProps: {
            onSuccess: ({ data }) => {
                toast.info(t('importStarted', { name: data?.name ?? '' }));
                closeDialog();
            },
            onError: ({ error }) => {
                if (error.serverError) toast.error(error.serverError);
            },
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('sourceUrl')}</FormLabel>
                            <FormControl>
                                <Input {...field} className="font-mono" placeholder="https://example.com/rootfs.tar" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="repo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('repository')}</FormLabel>
                            <FormControl>
                                <Input {...field} className="font-mono" placeholder="my-app" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="tag"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('tag')}</FormLabel>
                            <FormControl>
                                <Input {...field} className="font-mono" placeholder="latest" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={closeDialog}
                        disabled={form.formState.isSubmitting}
                    >
                        {tCommon('cancel')}
                    </Button>
                    <ProtectedAction action="image.pull">
                        <Button type="submit" isLoading={form.formState.isSubmitting}>
                            {t('import')}
                        </Button>
                    </ProtectedAction>
                </div>
            </form>
        </Form>
    );
}
