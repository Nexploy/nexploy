'use client';

import { toast } from 'sonner';
import { Repository } from 'generated/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateEnvironmentAction } from '@/actions/repository/settings/updateEnvironment.action';
import { updateEnvironmentSchema } from '@workspace/schemas-zod/repository/settings/updateEnvironment.schema';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { useTranslations } from 'next-intl';

interface EnvironmentSelectorProps {
    repository: Repository | null;
}

export function EnvironmentSelector({ repository }: EnvironmentSelectorProps) {
    const { environments } = useEnvironmentStore();
    const t = useTranslations('repository.settings');

    const bindUpdateEnvironmentAction = updateEnvironmentAction.bind(null, repository!.id);
    const { form, action } = useHookFormAction(
        bindUpdateEnvironmentAction,
        zodResolver(updateEnvironmentSchema),
        {
            formProps: {
                defaultValues: {
                    environmentId: repository?.environmentId,
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) {
                        form.reset({ environmentId: data.environmentId });
                        toast.success(t('environmentChangedTo', { name: data.environmentName }));
                    }
                },
                onError: () => {
                    form.setValue('environmentId', repository!.environmentId);
                    toast.error(t('environmentChangeError'));
                },
            },
        },
    );

    const handleEnvironmentChange = (environmentId: string) => {
        form.setValue('environmentId', environmentId);
        form.handleSubmit((data) => {
            bindUpdateEnvironmentAction(data);
        })();
    };

    const isExecuting = action.status === 'executing';
    const isLoading = environments.length === 0;

    return (
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex flex-col gap-0.5">
                <span className="text-base">{t('environment')}</span>
                <p className="text-muted-foreground text-sm">{t('environmentDescription')}</p>
            </div>
            <Select
                value={form.watch('environmentId')}
                onValueChange={handleEnvironmentChange}
                disabled={isLoading || isExecuting}
            >
                <SelectTrigger className="w-48">
                    {isLoading ? (
                        <span className="text-muted-foreground">{t('loading')}</span>
                    ) : (
                        <SelectValue placeholder={t('select')} />
                    )}
                </SelectTrigger>
                <SelectContent>
                    {environments.map((env) => (
                        <SelectItem key={env.id} value={env.id}>
                            <div className="flex items-center gap-2">
                                <span>{env.name}</span>
                                {env.isDefault && (
                                    <span className="text-muted-foreground text-xs">
                                        {t('default')}
                                    </span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
