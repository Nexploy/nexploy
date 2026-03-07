'use client';

import { Repository } from 'generated/client';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { deploymentSettingsAction } from '@/actions/repository/settings/deploymentSettings.action';
import { deploymentSettingsSchema } from '@workspace/schemas-zod/repository/settings/deploymentSettings.schema';
import { toast } from 'sonner';
import { DeploymentModeCard } from './DeploymentModeCard';
import { SwarmConfigCard } from './SwarmConfigCard';
import { ResourcesConfigCard } from './ResourcesConfigCard';
import { HealthCheckConfigCard } from './HealthCheckConfigCard';
import { Button } from '@workspace/ui/components/button';
import { Loader2, Save } from 'lucide-react';
import { Form } from '@workspace/ui/components/form';
import { SSEProvider } from '@/providers/SSEProviders';
import { useTranslations } from 'next-intl';

interface DeploymentSettingsProps {
    repository: Repository;
}

export function DeploymentSettings({ repository }: DeploymentSettingsProps) {
    const t = useTranslations('repository.settings.deployment');
    const { form, action, handleSubmitWithAction } = useHookFormAction(
        deploymentSettingsAction,
        zodResolver(deploymentSettingsSchema),
        {
            formProps: {
                defaultValues: {
                    repositoryId: repository.id,
                    ...repository,
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('updated'));
                },
                onError: ({ error }) => {
                    toast.error(error.serverError || t('updateError'));
                },
            },
        },
    );

    const isExecuting = action.status === 'executing';
    const deploymentMode = form.watch('deploymentMode');
    const isSwarmMode = deploymentMode === 'SWARM';

    return (
        <SSEProvider connections={['swarm']}>
            <Form {...form}>
                <form onSubmit={handleSubmitWithAction} className="mx-5 space-y-6">
                    <DeploymentModeCard form={form} />

                    {isSwarmMode && (
                        <>
                            <SwarmConfigCard form={form} />
                            <ResourcesConfigCard form={form} />
                        </>
                    )}

                    <HealthCheckConfigCard form={form} />

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isExecuting}>
                            {isExecuting ? <Loader2 className="animate-spin" /> : <Save />}
                            {t('save')}
                        </Button>
                    </div>
                </form>
            </Form>
        </SSEProvider>
    );
}
