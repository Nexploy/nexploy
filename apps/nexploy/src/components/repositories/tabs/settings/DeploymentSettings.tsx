'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Form } from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { Rocket, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Repository } from 'generated/client';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateDeploymentSchema } from '@workspace/schemas-zod/repository/settings/updateDeployment.schema';
import { updateDeploymentAction } from '@/actions/repository/settings/updateDeployment.action';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { DeploymentFields } from '@/components/repositories/forms/DeploymentFields';
import { toast } from 'sonner';

interface DeploymentSettingsProps {
    repository: Repository;
}

export function ChangeDeployment({ repository }: DeploymentSettingsProps) {
    const t = useTranslations('repository.deployment');

    const bindUpdateDeploymentAction = updateDeploymentAction.bind(null, repository.id);
    const { form, action, handleSubmitWithAction } = useHookFormAction(
        bindUpdateDeploymentAction,
        zodResolver(updateDeploymentSchema),
        {
            formProps: {
                defaultValues: {
                    environmentId: repository.environmentId,
                    autoDeploy: repository.autoDeploy,
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    toast.success(t('updated'));
                    if (data) form.reset(data);
                },
            },
        },
    );

    return (
        <Card>
            <CardHeaderWithIcon icon={Rocket} title={t('title')} description={t('description')} />
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="space-y-4">
                        <DeploymentFields />
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
