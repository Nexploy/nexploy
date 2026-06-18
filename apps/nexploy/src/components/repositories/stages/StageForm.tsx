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
import { Switch } from '@workspace/ui/components/switch';
import { Button } from '@workspace/ui/components/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';

import { fetcherApi } from '@/lib/api/fetcherApi';
import { upsertStageAction } from '@/actions/repository/stages/upsertStage.action';
import { deploymentStageSchema } from '@workspace/schemas-zod/repository/deploymentStage.schema';
import type { DeploymentStage } from '@workspace/typescript-interface/repository/deploymentStage';

interface EnvironmentOption {
    id: string;
    name: string;
}

interface StageFormProps {
    repositoryId: string;
    stage?: DeploymentStage;
    onSaved?: () => void;
    onCancelEdit?: () => void;
}

const NO_ENVIRONMENT = '__none__';

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');

export function StageForm({ repositoryId, stage, onSaved, onCancelEdit }: StageFormProps) {
    const t = useTranslations('repository.stages');
    const isEdit = !!stage;

    const { data: environments } = useSWR<EnvironmentOption[]>(
        { url: '/api/environments' },
        fetcherApi,
    );

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        upsertStageAction,
        zodResolver(deploymentStageSchema),
        {
            formProps: {
                defaultValues: {
                    id: stage?.id,
                    repositoryId,
                    name: stage?.name ?? '',
                    slug: stage?.slug ?? '',
                    isProduction: stage?.isProduction ?? false,
                    environmentId: stage?.environmentId ?? null,
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(isEdit ? t('updateSuccess') : t('createSuccess'));
                    if (!isEdit) {
                        form.reset({
                            id: undefined,
                            repositoryId,
                            name: '',
                            slug: '',
                            isProduction: false,
                            environmentId: null,
                        });
                    }
                    onSaved?.();
                },
            },
        },
    );

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-3">
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
                                    onChange={(e) => {
                                        field.onChange(e);
                                        if (!isEdit && !form.getValues('slug')) {
                                            form.setValue('slug', slugify(e.target.value));
                                        }
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('slugLabel')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="prod"
                                    onChange={(e) => field.onChange(slugify(e.target.value))}
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
                            <Select
                                value={field.value ?? NO_ENVIRONMENT}
                                onValueChange={(value) =>
                                    field.onChange(value === NO_ENVIRONMENT ? null : value)
                                }
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('environmentPlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={NO_ENVIRONMENT}>
                                        {t('environmentDefault')}
                                    </SelectItem>
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
                    name="isProduction"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                            <FormLabel>{t('isProductionLabel')}</FormLabel>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-1">
                    {isEdit && (
                        <Button type="button" variant="ghost" onClick={onCancelEdit}>
                            {t('cancelEdit')}
                        </Button>
                    )}
                    <Button type="submit" isLoading={action.isPending} disabled={action.isPending}>
                        {isEdit ? t('saveStage') : t('addStage')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
