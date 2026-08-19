'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { ProtectedAction } from '@/components/permission/ProtectedAction';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { imageTagSchema } from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { onImageTagAction } from '@/actions/docker/image/imageTagAction.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import type { Image } from '@workspace/typescript-interface/docker/docker.image';
import { splitRepoTag } from '@/utils/imageTag';

interface ImageTagFormProps {
    image: Image;
}

export function ImageTagForm({ image }: ImageTagFormProps) {
    const t = useTranslations('docker.imageActions');
    const tCommon = useTranslations('common');
    const closeDialog = useConfirmationDialogStore((state) => state.closeDialog);

    const { repo } = splitRepoTag(image.repoTags[0]);

    const { form, handleSubmitWithAction } = useHookFormAction(onImageTagAction, zodResolver(imageTagSchema), {
        formProps: {
            defaultValues: {
                imageId: image.id,
                repo,
                tag: 'latest',
            },
        },
        actionProps: {
            onSuccess: () => {
                toast.success(t('tagSuccess'));
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
                    name="repo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('repository')}</FormLabel>
                            <FormControl>
                                <Input {...field} className="font-mono" placeholder="registry.io/app" />
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
                    <ProtectedAction action="image.manage">
                        <Button type="submit" isLoading={form.formState.isSubmitting}>
                            {t('tag')}
                        </Button>
                    </ProtectedAction>
                </div>
            </form>
        </Form>
    );
}
