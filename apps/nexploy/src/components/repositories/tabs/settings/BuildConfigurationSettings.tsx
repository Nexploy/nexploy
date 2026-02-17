'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Form } from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { Hammer, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Repository } from 'generated/client';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildTypeSchema } from '@workspace/schemas-zod/repository/buildType.schema';
import { updateBuildTypeAction } from '@/actions/repository/settings/updateBuildType.action';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { BuildConfigurationFields } from '@/components/repositories/forms/BuildConfigurationFields';

interface BuildConfigurationSettingsProps {
    repository: Repository;
}

export function BuildConfigurationSettings({ repository }: BuildConfigurationSettingsProps) {
    const tSettings = useTranslations('repository.settings.buildType');

    const bindUpdateBuildTypeAction = updateBuildTypeAction.bind(null, repository.id);
    const { form, action, handleSubmitWithAction } = useHookFormAction(
        bindUpdateBuildTypeAction,
        zodResolver(buildTypeSchema),
        {
            formProps: {
                defaultValues: {
                    buildType: repository.buildType,
                    dockerfilePath: repository.dockerfilePath ?? 'Dockerfile',
                    dockerComposePath: repository.dockerComposePath ?? 'docker-compose.yml',
                    contextPath: repository.contextPath ?? '.',
                    buildArgs: repository.buildArgs ?? '',
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) form.reset(data);
                },
            },
        },
    );

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Hammer}
                title={tSettings('title')}
                description={tSettings('description')}
            />
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="space-y-4">
                        <BuildConfigurationFields />
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                icon={Save}
                                disabled={action.isPending || !form.formState.isDirty}
                            >
                                {action.isPending ? tSettings('saving') : tSettings('save')}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
