'use client';

import useSWR from 'swr';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { imagePushSchema } from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { onImagePushAction } from '@/actions/docker/image/imagePushAction.action';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import type { RegistryInfo } from '@/services/registry.service';
import type { Image } from '@workspace/typescript-interface/docker/docker.image';

interface ImagePushFormProps {
    image: Image;
}

export function ImagePushForm({ image }: ImagePushFormProps) {
    const t = useTranslations('docker.imageActions');
    const tCommon = useTranslations('common');
    const closeDialog = useConfirmationDialogStore((state) => state.closeDialog);

    const { data: registries } = useSWR<RegistryInfo[]>({ url: '/api/registries' }, fetcherApi);

    const { form, handleSubmitWithAction } = useHookFormAction(onImagePushAction, zodResolver(imagePushSchema), {
        formProps: {
            defaultValues: {
                imageName: image.repoTags[0] ?? '',
                registryId: 'none',
            },
        },
        actionProps: {
            onSuccess: ({ data }) => {
                toast.info(t('pushStarted', { name: data?.name ?? '' }));
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
                    name="imageName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('imageReference')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('imageReference')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {image.repoTags.map((repoTag) => (
                                        <SelectItem key={repoTag} value={repoTag}>
                                            {repoTag}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="registryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('registry')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? 'none'}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('registryNone')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">{t('registryNone')}</SelectItem>
                                    {(registries ?? []).map((registry) => (
                                        <SelectItem key={registry.id} value={registry.id}>
                                            {registry.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                    <Button type="submit" isLoading={form.formState.isSubmitting}>
                        {t('push')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
