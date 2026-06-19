'use client';

import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

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
import { DialogFooter } from '@workspace/ui/components/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';

import { fetcherApi } from '@/lib/api/fetcherApi';
import { upsertStageAction } from '@/actions/repository/stages/upsertStage.action';
import { usePipelineStage } from '@/hooks/pipeline/usePipelineStage.ts';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { deploymentStageSchema } from '@workspace/schemas-zod/repository/deploymentStage.schema';
import type { DeploymentStage } from '@workspace/typescript-interface/repository/deploymentStage';

const NONE_VALUE = '__none__';

interface EnvironmentOption {
    id: string;
    name: string;
}

interface StageFormProps {
    repositoryId: string;
    stage?: DeploymentStage;
}

export function StageForm({ repositoryId, stage }: StageFormProps) {
    const t = useTranslations('repository.stages');
    const isEdit = !!stage;
    const { onSuccess } = useConfirmationDialogStore();

    const { data: environments } = useSWR<EnvironmentOption[]>(
        { url: '/api/environments' },
        fetcherApi,
    );

    const { stages } = usePipelineStage(repositoryId);
    const protectionStages = stages.filter((s) => s.id !== stage?.id);

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        upsertStageAction,
        zodResolver(deploymentStageSchema),
        {
            formProps: {
                defaultValues: {
                    id: stage?.id,
                    repositoryId,
                    name: stage?.name ?? '',
                    isProduction: stage?.isProduction ?? false,
                    environmentId: stage?.environmentId ?? undefined,
                    requiredStageId: stage?.requiredStageId ?? null,
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(isEdit ? t('updateSuccess') : t('createSuccess'));
                    onSuccess?.();
                },
                onError: () => {
                    toast.error(t('error'));
                },
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
                                    {...field}
                                    placeholder={t('namePlaceholder')}
                                    disabled={action.isPending}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="environmentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('environmentLabel')}</FormLabel>
                            <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('environmentPlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {(environments ?? []).map((env) => (
                                        <SelectItem key={env.id} value={env.id}>
                                            {env.name}
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
                    name="requiredStageId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('requiredStageLabel')}</FormLabel>
                            <Select
                                value={field.value ?? NONE_VALUE}
                                onValueChange={(value) =>
                                    field.onChange(value === NONE_VALUE ? null : value)
                                }
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t('requiredStagePlaceholder')}
                                        />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={NONE_VALUE}>
                                        {t('requiredStageNone')}
                                    </SelectItem>
                                    {protectionStages.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-muted-foreground text-xs">
                                {t('requiredStageHint')}
                            </p>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <Button
                        type="submit"
                        isLoading={action.isPending}
                        disabled={action.isPending || !form.formState.isDirty}
                    >
                        {isEdit ? t('saveStage') : t('addStage')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
