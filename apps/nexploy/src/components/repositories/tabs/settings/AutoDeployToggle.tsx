'use client';

import { Switch } from '@workspace/ui/components/switch';
import { toast } from 'sonner';
import { Label } from '@workspace/ui/components/label';
import { Repository } from 'generated/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { toggleAutoDeployAction } from '@/actions/repository/settings/toggleAutoDeploy.action';
import { toggleAutoDeploySchema } from '@workspace/schemas-zod/repository/settings/toggleAutoDeploy.schema';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { useTranslations } from 'next-intl';

interface AutoDeployToggleProps {
    repository: Repository;
}

export function AutoDeployToggle({ repository }: AutoDeployToggleProps) {
    const t = useTranslations('repository.settings.autoDeploy');
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
                    toast.success(data?.autoDeploy ? t('enabled') : t('disabled'));
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
        <form onSubmit={handleSubmitWithAction}>
            <Label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                <div className="flex flex-col gap-0.5">
                    <span className="text-base">{t('title')}</span>
                    <p className="text-muted-foreground text-sm">
                        {t('description')}
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
    );
}
