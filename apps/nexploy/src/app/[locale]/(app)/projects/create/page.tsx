'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Folder, Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { projectCreateFormSchema } from '@workspace/schemas-zod/project/projectCreate.schema';
import { onProjectCreateAction } from '@/actions/project/projectCreate.action';
import { GeneralInfoStep } from '@/components/projects/create/steps/GeneralInfoStep';
import { GitSourceStep } from '@/components/projects/create/steps/source/GitSourceStep';
import { BuildConfigurationStep } from '@/components/projects/create/steps/BuildConfigurationStep';
import { DeploymentStep } from '@/components/projects/create/steps/DeploymentStep';

export default function AddProjectPage() {
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onProjectCreateAction,
        zodResolver(projectCreateFormSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    description: '',
                    branch: 'main',
                    gitToken: '',
                    gitProvider: 'github',
                    buildType: 'DOCKERFILE',
                    dockerfilePath: 'Dockerfile',
                    contextPath: '.',
                    buildArgs: '',
                    autoDeploy: true,
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) router.push(`/projects/${data}`);
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    return (
        <div className="flex flex-1 flex-col gap-5 overflow-hidden pt-5">
            <div className="flex justify-between gap-4 px-5">
                <div className="flex gap-3">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Folder className="text-primary size-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            Nouveau projet
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Créer et déployer une nouvelle application depuis Git
                        </p>
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
                        Retour
                    </Button>
                    <Button
                        type="submit"
                        icon={Plus}
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                        onClick={handleSubmitWithAction}
                    >
                        {isSubmitting ? 'Création en cours...' : 'Créer le projet'}
                    </Button>
                </div>
            </div>

            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <Form {...form}>
                    <div className="space-y-5 px-5 pb-5">
                        <GeneralInfoStep />
                        <GitSourceStep />
                        <BuildConfigurationStep />
                        <DeploymentStep />
                    </div>
                </Form>
            </ScrollAreaWithShadow>
        </div>
    );
}
