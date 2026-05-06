'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Layers, Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { createServiceFormSchema } from '@workspace/schemas-zod/docker/swarm/serviceAction.schema';
import { onCreateServiceAction } from '@/actions/docker/swarm/serviceAction.action';
import { InputAutoCompleteOption } from '@workspace/ui/components/search-command';
import { useTranslations } from 'next-intl';
import { ServiceBasicConfig } from './ServiceBasicConfig';
import { ServicePorts } from './ServicePorts';
import { ServiceEnvVars } from './ServiceEnvVars';
import { ServiceNetworks } from './ServiceNetworks';
import { ServiceLabels } from './ServiceLabels';
import { ServiceMounts } from './ServiceMounts';
import { ServiceResources } from './ServiceResources';
import { ServicePlacement } from './ServicePlacement';
import { ServiceUpdatePolicy } from './ServiceUpdatePolicy';

interface CreateServiceProps {
    listImages: InputAutoCompleteOption[];
}

export default function CreateService({ listImages }: CreateServiceProps) {
    const router = useRouter();
    const t = useTranslations('swarm.createService');

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onCreateServiceAction,
        zodResolver(createServiceFormSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    image: '',
                    mode: 'replicated' as const,
                    replicas: 1,
                    ports: [],
                    envVars: [],
                    networks: [],
                    labelsList: [],
                    constraints: [],
                    command: '',
                    workDir: '',
                    user: '',
                    mounts: [],
                    cpuLimit: '',
                    memoryLimit: '',
                    cpuReservation: '',
                    memoryReservation: '',
                },
            },
            actionProps: {
                onExecute: () => {
                    toast.loading(t('creatingService'), { id: 'service-create' });
                },
                onSuccess: ({ input }) => {
                    toast.dismiss('service-create');
                    toast.success(t('serviceCreatedSuccess', { name: input.name }));
                    router.push('/swarm');
                },
                onError: () => {
                    toast.dismiss('service-create');
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    return (
        <div className="flex h-full flex-1 flex-col gap-5 pt-5">
            <Form {...form}>
                <form
                    className="flex flex-1 flex-col overflow-hidden"
                    onSubmit={handleSubmitWithAction}
                >
                    <div className="mb-5 flex justify-between gap-4 px-5">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                                <Layers className="text-primary size-7" />
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
                            >
                                {isSubmitting ? t('creatingService') : t('createButton')}
                            </Button>
                        </div>
                    </div>

                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="flex flex-col gap-4 px-5 pb-5">
                            <ServiceBasicConfig listImages={listImages} />
                            <ServicePorts />
                            <ServiceEnvVars />
                            <ServiceNetworks />
                            <ServiceLabels />
                            <ServiceMounts />
                            <ServiceResources />
                            <ServicePlacement />
                            <ServiceUpdatePolicy />
                        </div>
                    </ScrollAreaWithShadow>
                </form>
            </Form>
        </div>
    );
}
