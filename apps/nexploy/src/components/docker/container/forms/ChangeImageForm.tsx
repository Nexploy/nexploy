'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { InputAutoComplete } from '@workspace/ui/components/search-command';
import { Button } from '@workspace/ui/components/button';
import { Switch } from '@workspace/ui/components/switch';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Alert, AlertTitle } from '@workspace/ui/components/alert';
import { DialogClose, DialogFooter } from '@workspace/ui/components/dialog';
import { Info } from 'lucide-react';
import useSWR from 'swr';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useImagesStore } from '@/stores/docker/useImagesStore';
import { containerChangeImageSchema } from '@workspace/schemas-zod/docker/container/containerRecreate.schema';
import { onContainerChangeImageAction } from '@/actions/docker/container/containerChangeImage.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { fetcherApi } from '@/lib/api/fetcherApi';
import type { RegistryInfo } from '@/services/registry.service';

interface ChangeImageFormProps {
    containerId: string;
    currentImage: string;
}

export function ChangeImageForm({ containerId, currentImage }: ChangeImageFormProps) {
    const t = useTranslations('docker.changeImage');
    const router = useRouter();
    const { closeDialog } = useConfirmationDialogStore();

    const { data: registries = [] } = useSWR<RegistryInfo[]>(
        { url: '/api/registries' },
        fetcherApi,
    );

    const images = useImagesStore((state) => state.images);

    const imageOptions = useMemo(() => {
        const names = new Set<string>();
        for (const img of images) {
            for (const repoTag of img.repoTags ?? []) {
                if (repoTag === '<none>:<none>') continue;
                names.add(repoTag);
            }
        }
        return Array.from(names)
            .sort()
            .map((name) => ({ value: name, label: name }));
    }, [images]);

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        onContainerChangeImageAction,
        zodResolver(containerChangeImageSchema),
        {
            formProps: {
                defaultValues: {
                    containerId,
                    image: currentImage,
                    registryId: 'none',
                    pullImage: true,
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    closeDialog();
                    if (data) router.replace(`/docker/containers/${data.id}`);
                },
            },
        },
    );

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <Alert variant="info">
                    <Info />
                    <AlertTitle className={'line-clamp-0'}>{t('recreateWarning')}</AlertTitle>
                </Alert>

                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('imageLabel')}</FormLabel>
                            <FormControl>
                                <InputAutoComplete
                                    {...field}
                                    options={imageOptions}
                                    heading={t('imageLabel')}
                                    autoComplete="off"
                                    placeholder={t('imagePlaceholder')}
                                    disabled={form.formState.isSubmitting}
                                />
                            </FormControl>
                            <FormDescription>{t('imageDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {registries.length > 0 && (
                    <FormField
                        control={form.control}
                        name="registryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('registryLabel')}</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value ?? 'none'}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('registryNone')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="none">
                                                {t('registryNone')}
                                            </SelectItem>
                                            {registries.map((registry) => (
                                                <SelectItem key={registry.id} value={registry.id}>
                                                    {registry.name} ({registry.url})
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="pullImage"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <FormLabel>{t('refetchLabel')}</FormLabel>
                                <FormDescription>{t('refetchDescription')}</FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={form.formState.isSubmitting}
                                />
                            </FormControl>
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
                        {t('apply')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
