'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Hammer, Save } from 'lucide-react';
import { Repository } from 'generated/client';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { BuildType, buildTypeSchema } from '@workspace/schemas-zod/repository/buildType.schema';
import { updateBuildTypeAction } from '@/actions/repository/settings/updateBuildType.action';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';

interface ChangeBuildTypeProps {
    repository: Repository;
}

const buildTypeValues: BuildType[] = ['DOCKERFILE', 'DOCKER_COMPOSE', 'NIXPACKS', 'BUILDPACKS'];

export function ChangeBuildType({ repository }: ChangeBuildTypeProps) {
    const t = useTranslations('repository.settings.buildType');

    const buildTypeOptions = buildTypeValues.map((value) => ({
        value,
        label: t(
            value === 'DOCKERFILE'
                ? 'dockerfile'
                : value === 'DOCKER_COMPOSE'
                  ? 'dockerCompose'
                  : value === 'NIXPACKS'
                    ? 'nixpacks'
                    : 'buildpacks',
        ),
    }));
    const bindUpdateBuildTypeAction = updateBuildTypeAction.bind(null, repository.id);
    const { form, action, handleSubmitWithAction } = useHookFormAction(
        bindUpdateBuildTypeAction,
        zodResolver(buildTypeSchema),
        {
            formProps: {
                defaultValues: {
                    buildType: repository.buildType,
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) form.reset({ buildType: data });
                },
            },
        },
    );

    return (
        <Card>
            <CardHeaderWithIcon icon={Hammer} title={t('title')} description={t('description')} />
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="buildType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('label')}</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="min-w-48">
                                                <SelectValue placeholder={t('selectType')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {buildTypeOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                icon={Save}
                                disabled={action.isPending || !form.formState.isDirty}
                            >
                                {action.isPending ? t('saving') : t('save')}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
