'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Folder, Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { repositoryCreateFormSchema } from '@workspace/schemas-zod/repository/repositoryCreate.schema';
import { onRepositoryCreateAction } from '@/actions/repository/repositoryCreate.action';
import { GitSourceStep } from '@/components/repositories/steps/GitSourceStep';
import { BuildConfigurationStep } from '@/components/repositories/steps/BuildConfigurationStep';
import { DeploymentStep } from '@/components/repositories/steps/DeploymentStep';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

export default function AddRepositoryPage() {
    const t = useTranslations('repository.create');
    const router = useRouter();
    const selectedEnvironmentId = useEnvironmentStore((state) => state.selectedEnvironmentId);

    const defaultValues = {
        name: '',
        branch: 'main',
        gitToken: '',
        gitProvider: 'github' as const,
        autoDeploy: true,
        environmentId: selectedEnvironmentId ?? undefined,
    };

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onRepositoryCreateAction,
        zodResolver(repositoryCreateFormSchema),
        {
            formProps: { defaultValues },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) router.push(`/repositories/${data}`);
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    useEffect(() => {
        const currentValue = form.getValues('environmentId');
        if (selectedEnvironmentId && !currentValue) {
            form.setValue('environmentId', selectedEnvironmentId);
        }
    }, [selectedEnvironmentId]);

    return (
        <div className="flex h-full flex-1 flex-col gap-5 pt-5">
            <div className="flex justify-between gap-4 px-5">
                <div className="flex gap-3">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Folder className="text-primary size-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        icon={ArrowLeft}
                        onClick={router.back}
                        disabled={isSubmitting}
                    >
                        {t('back')}
                    </Button>
                    <Button
                        type="submit"
                        icon={Plus}
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                        onClick={handleSubmitWithAction}
                    >
                        {isSubmitting ? t('creating') : t('createProject')}
                    </Button>
                </div>
            </div>

            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <Form {...form}>
                    <div className="space-y-5 px-5 pb-5">
                        <GitSourceStep />
                        <BuildConfigurationStep />
                        <DeploymentStep />
                    </div>
                </Form>
            </ScrollAreaWithShadow>
        </div>
    );
}
