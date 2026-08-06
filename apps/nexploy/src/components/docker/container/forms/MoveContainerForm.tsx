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
import { Button } from '@workspace/ui/components/button';
import { Switch } from '@workspace/ui/components/switch';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
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
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { containerMigrateFormSchema } from '@workspace/schemas-zod/docker/container/containerMigrate.schema';
import { onContainerMigrateAction } from '@/actions/docker/container/containerMigrate.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useEnvironmentStore } from '@/stores/docker/useEnvironmentStore';
import { fetcherApi } from '@/lib/api/fetcherApi';
import type { RegistryInfo } from '@/services/registry.service';

interface MoveContainerFormProps {
    containerId: string;
    containerName: string;
}

const SOURCE_ACTIONS = ['stop', 'remove', 'keep'] as const;

export function MoveContainerForm({ containerId, containerName }: MoveContainerFormProps) {
    const t = useTranslations('docker.moveContainer');
    const { closeDialog } = useConfirmationDialogStore();

    const { data: registries = [] } = useSWR<RegistryInfo[]>({ url: '/api/registries' }, fetcherApi);

    const environments = useEnvironmentStore((state) => state.environments);
    const selectedEnvironmentId = useEnvironmentStore((state) => state.selectedEnvironmentId);

    const targetEnvironments = useMemo(
        () => environments.filter((environment) => environment.id !== selectedEnvironmentId),
        [environments, selectedEnvironmentId],
    );

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        onContainerMigrateAction,
        zodResolver(containerMigrateFormSchema),
        {
            formProps: {
                defaultValues: {
                    containerId,
                    targetEnvironmentId: targetEnvironments[0]?.id ?? '',
                    migrateVolumeData: false,
                    sourceAction: 'stop' as const,
                    startAfterMigration: true,
                    registryId: 'none',
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (!data) return;

                    closeDialog();
                    toast.info(t('startedTitle', { name: data.name }), {
                        description: t('startedDescription'),
                    });
                },
            },
        },
    );

    if (targetEnvironments.length === 0) {
        return (
            <div className="space-y-4">
                <Alert variant="info">
                    <Info />
                    <AlertTitle className="line-clamp-0">{t('noTargetEnvironment')}</AlertTitle>
                </Alert>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            {t('cancel')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <Alert variant="info">
                    <Info />
                    <AlertTitle className="line-clamp-0">{t('moveWarning', { name: containerName })}</AlertTitle>
                </Alert>

                <FormField
                    control={form.control}
                    name="targetEnvironmentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('targetLabel')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('targetPlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent align="start">
                                    <SelectGroup>
                                        {targetEnvironments.map((environment) => (
                                            <SelectItem key={environment.id} value={environment.id}>
                                                {environment.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormDescription>{t('targetDescription')}</FormDescription>
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
                                <Select onValueChange={field.onChange} value={field.value ?? 'none'}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('registryNone')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent align="start">
                                        <SelectGroup>
                                            <SelectItem value="none">{t('registryNone')}</SelectItem>
                                            {registries.map((registry) => (
                                                <SelectItem key={registry.id} value={registry.id}>
                                                    {registry.name} ({registry.url})
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormDescription>{t('registryDescription')}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="migrateVolumeData"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center justify-between rounded-lg cursor-pointer border p-3">
                                <div className={'flex flex-col'}>
                                    <span>{t('volumeDataLabel')}</span>
                                    <FormDescription>{t('volumeDataDescription')}</FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={form.formState.isSubmitting}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormLabel>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="startAfterMigration"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center justify-between rounded-lg cursor-pointer border p-3">
                                <div className={'flex flex-col'}>
                                    <span>{t('startLabel')}</span>
                                    <FormDescription>{t('startDescription')}</FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={form.formState.isSubmitting}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormLabel>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="sourceAction"
                    render={({ field }) => (
                        <FormItem className="space-y-3 rounded-lg border p-3">
                            <FormLabel>{t('sourceActionLabel')}</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={form.formState.isSubmitting}
                                >
                                    {SOURCE_ACTIONS.map((sourceAction) => (
                                        <label
                                            key={sourceAction}
                                            htmlFor={`source-action-${sourceAction}`}
                                            className="flex cursor-pointer items-start gap-3"
                                        >
                                            <RadioGroupItem
                                                id={`source-action-${sourceAction}`}
                                                value={sourceAction}
                                                className="mt-0.5"
                                            />
                                            <div className="space-y-0.5">
                                                <p className="text-sm leading-none font-medium">
                                                    {t(`sourceAction.${sourceAction}.label`)}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {t(`sourceAction.${sourceAction}.description`)}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </RadioGroup>
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
                        {t('move')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
