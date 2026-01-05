'use client';

import { toast } from 'sonner';
import { Environment, Repository } from 'generated/client';
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

interface EnvironmentSelectorProps {
    repository: Repository & { environment?: Environment | null };
}

export function EnvironmentSelector({ repository }: EnvironmentSelectorProps) {
    const { environments } = useEnvironmentStore();

    const bindUpdateEnvironmentAction = updateEnvironmentAction.bind(null, repository.id);
    const { form, action } = useHookFormAction(
        bindUpdateEnvironmentAction,
        zodResolver(updateEnvironmentSchema),
        {
            formProps: {
                defaultValues: {
                    environmentId: repository.environmentId,
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) {
                        form.reset({ environmentId: data.environmentId });
                        toast.success(`Environnement changé vers "${data.environmentName}"`);
                    }
                },
                onError: () => {
                    form.setValue('environmentId', repository.environmentId);
                    toast.error("Erreur lors du changement d'environnement");
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
                <span className="text-base">Environnement</span>
                <p className="text-muted-foreground text-sm">
                    Environnement Docker cible pour le déploiement
                </p>
            </div>
            <Select
                value={form.watch('environmentId')}
                onValueChange={handleEnvironmentChange}
                disabled={isLoading || isExecuting}
            >
                <SelectTrigger className="w-48">
                    {isLoading ? (
                        <span className="text-muted-foreground">Chargement...</span>
                    ) : (
                        <SelectValue placeholder="Sélectionner" />
                    )}
                </SelectTrigger>
                <SelectContent>
                    {environments.map((env) => (
                        <SelectItem key={env.id} value={env.id}>
                            <div className="flex items-center gap-2">
                                <span>{env.name}</span>
                                {env.isDefault && (
                                    <span className="text-muted-foreground text-xs">(défaut)</span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
