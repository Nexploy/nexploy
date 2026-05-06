'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Container, Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { containerCreateFormSchema } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import { onContainerCreateAction } from '@/actions/docker/container/containerCreate.action';
import { useTranslations } from 'next-intl';
import { ContainerTemplates } from '@/components/docker/containers/create/ContainerTemplates';
import { ContainerBasicConfig } from '@/components/docker/containers/create/ContainerBasicConfig';
import { ContainerPorts } from '@/components/docker/containers/create/ContainerPorts';
import { ContainerEnvVars } from '@/components/docker/containers/create/ContainerEnvVars';
import { ContainerVolumes } from '@/components/docker/containers/create/ContainerVolumes';
import { ContainerNetworks } from '@/components/docker/containers/create/ContainerNetworks';

export default function CreateContainer() {
    const router = useRouter();
    const t = useTranslations('docker.createContainer');
    const searchParams = useSearchParams();
    const imageFromUrl = searchParams.get('image') || '';

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onContainerCreateAction,
        zodResolver(containerCreateFormSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    image: imageFromUrl,
                    restart: 'unless-stopped' as const,
                    networks: [],
                    hostname: '',
                    autoRemove: false,
                    privileged: false,
                    ports: [],
                    envVars: [],
                    volumes: [],
                },
            },
            actionProps: {
                onExecute: () => {
                    toast.loading(t('creatingContainer'), { id: 'container-create' });
                },
                onSuccess: ({ data }) => {
                    toast.dismiss('container-create');
                    if (data?.id) {
                        router.push(`/docker/containers/${data.id}`);
                    }
                },
                onError: () => {
                    toast.dismiss('container-create');
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
                                <Container className="text-primary size-7" />
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
                                {isSubmitting ? t('creatingContainer') : t('createButton')}
                            </Button>
                        </div>
                    </div>

                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="flex flex-col gap-4 px-5 pb-5">
                            <ContainerTemplates />
                            <ContainerBasicConfig />
                            <ContainerPorts />
                            <ContainerEnvVars />
                            <ContainerVolumes />
                            <ContainerNetworks />
                        </div>
                    </ScrollAreaWithShadow>
                </form>
            </Form>
        </div>
    );
}
