'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Switch } from '@workspace/ui/components/switch';
import { Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@workspace/ui/components/label';
import { Repository } from 'generated/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { toggleAutoDeployAction } from '@/actions/repository/settings/toggleAutoDeploy.action';
import { toggleAutoDeploySchema } from '@workspace/schemas-zod/repository/settings/toggleAutoDeploy.schema';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';

interface ChangeDeploymentProps {
    repository: Repository;
}

export function ChangeDeployment({ repository }: ChangeDeploymentProps) {
    const { form, action, handleSubmitWithAction } = useHookFormAction(
        toggleAutoDeployAction,
        zodResolver(toggleAutoDeploySchema),
        {
            formProps: {
                defaultValues: {
                    repositoryId: repository.id,
                    autoDeploy: repository.autoDeploy,
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    toast.success(
                        data?.autoDeploy ? 'Auto-deploy activé' : 'Auto-deploy désactivé',
                    );
                },
                onError: () => {
                    form.setValue('autoDeploy', !form.getValues('autoDeploy'));
                },
            },
        },
    );

    const handleToggle = (checked: boolean) => {
        form.setValue('autoDeploy', checked);
        handleSubmitWithAction();
    };

    const isExecuting = action.status === 'executing';

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Rocket}
                title={'Déploiement'}
                description={'Paramètres de déploiement'}
            />
            <CardContent>
                <form onSubmit={handleSubmitWithAction}>
                    <Label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-base">Déploiement automatique</span>
                            <p className="text-muted-foreground text-sm">
                                Déployer automatiquement lors d'un push sur la branche
                            </p>
                        </div>

                        <Switch
                            id="auto-deploy"
                            checked={form.watch('autoDeploy')}
                            onCheckedChange={handleToggle}
                            disabled={isExecuting}
                        />
                    </Label>
                </form>
            </CardContent>
        </Card>
    );
}
