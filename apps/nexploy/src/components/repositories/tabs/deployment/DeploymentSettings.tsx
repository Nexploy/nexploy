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
    repository: Pick<
        Repository,
        | 'id'
        | 'buildType'
        | 'deploymentMode'
        | 'replicas'
        | 'updateParallelism'
        | 'updateDelay'
        | 'updateFailureAction'
        | 'updateOrder'
        | 'rollbackParallelism'
        | 'rollbackDelay'
        | 'rollbackFailureAction'
        | 'restartCondition'
        | 'restartDelay'
        | 'restartMaxAttempts'
        | 'restartWindow'
        | 'cpuLimit'
        | 'cpuReservation'
        | 'memoryLimit'
        | 'memoryReservation'
        | 'placementConstraints'
        | 'healthCheckEnabled'
        | 'healthCheckCommand'
        | 'healthCheckInterval'
        | 'healthCheckTimeout'
        | 'healthCheckRetries'
        | 'healthCheckStartPeriod'
    >;
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
                    deploymentMode: repository.deploymentMode,
                    replicas: repository.replicas,
                    updateParallelism: repository.updateParallelism,
                    updateDelay: repository.updateDelay,
                    updateFailureAction: repository.updateFailureAction,
                    updateOrder: repository.updateOrder,
                    rollbackParallelism: repository.rollbackParallelism,
                    rollbackDelay: repository.rollbackDelay,
                    rollbackFailureAction: repository.rollbackFailureAction,
                    restartCondition: repository.restartCondition,
                    restartDelay: repository.restartDelay,
                    restartMaxAttempts: repository.restartMaxAttempts,
                    restartWindow: repository.restartWindow,
                    cpuLimit: repository.cpuLimit,
                    cpuReservation: repository.cpuReservation,
                    memoryLimit: repository.memoryLimit,
                    memoryReservation: repository.memoryReservation,
                    placementConstraints: repository.placementConstraints,
                    healthCheckEnabled: repository.healthCheckEnabled,
                    healthCheckCommand: repository.healthCheckCommand,
                    healthCheckInterval: repository.healthCheckInterval,
                    healthCheckTimeout: repository.healthCheckTimeout,
                    healthCheckRetries: repository.healthCheckRetries,
                    healthCheckStartPeriod: repository.healthCheckStartPeriod,
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
                    <DeploymentModeCard form={form} buildType={repository.buildType} />

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
