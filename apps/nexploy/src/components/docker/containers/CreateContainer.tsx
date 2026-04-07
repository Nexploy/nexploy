'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Container, Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { containerCreateFormSchema } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import { onContainerCreateAction } from '@/actions/docker/container/containerCreate.action';
import { onImagePullAction } from '@/actions/docker/image/imagePullAction.action';
import { useImageStore } from '@/stores/docker/useImageStore';
import { InputAutoCompleteOption } from '@workspace/ui/components/search-command';
import { useTranslations } from 'next-intl';
import { ContainerTemplates } from '@/components/docker/containers/create/ContainerTemplates';
import { ContainerBasicConfig } from '@/components/docker/containers/create/ContainerBasicConfig';
import { ContainerPorts } from '@/components/docker/containers/create/ContainerPorts';
import { ContainerEnvVars } from '@/components/docker/containers/create/ContainerEnvVars';
import { ContainerVolumes } from '@/components/docker/containers/create/ContainerVolumes';

interface CreateContainerProps {
    listImages: InputAutoCompleteOption[];
}

export default function CreateContainer({ listImages }: CreateContainerProps) {
    const router = useRouter();
    const t = useTranslations('docker.createContainer');
    const searchParams = useSearchParams();
    const imageFromUrl = searchParams.get('image') || '';

    const [createStep, setCreateStep] = useState<'idle' | 'pulling' | 'creating'>('idle');

    const getImagesByTag = useImageStore((state) => state.getImagesByTag);
    const { executeAsync: executePullImage } = useAction(onImagePullAction);
    const { executeAsync: executeCreate } = useAction(onContainerCreateAction);

    const form = useForm({
        resolver: zodResolver(containerCreateFormSchema),
        defaultValues: {
            name: '',
            image: imageFromUrl,
            restart: 'unless-stopped' as const,
            network: '',
            hostname: '',
            autoRemove: false,
            privileged: false,
            ports: [],
            envVars: [],
            volumes: [],
        },
    });

    const handleCreate = form.handleSubmit(async (data) => {
        const toastId = 'container-create';
        const imageExistsLocally = getImagesByTag(data.image).length > 0;

        if (!imageExistsLocally) {
            setCreateStep('pulling');
            toast.loading(t('pullingImage'), { id: toastId });

            const pullResult = await executePullImage({ imageName: data.image });
            if (!pullResult?.data) {
                setCreateStep('idle');
                toast.dismiss(toastId);
                return;
            }
        }

        setCreateStep('creating');
        toast.loading(t('creatingContainer'), { id: toastId });

        const createResult = await executeCreate(data);
        toast.dismiss(toastId);
        setCreateStep('idle');

        if (createResult?.data?.id) {
            router.push(`/docker/containers/${createResult.data.id}`);
        }
    });

    const isSubmitting = createStep !== 'idle';

    const submitLabel =
        createStep === 'pulling'
            ? t('pullingImage')
            : createStep === 'creating'
              ? t('creatingContainer')
              : t('createButton');

    return (
        <div className="flex h-full flex-1 flex-col gap-5 pt-5">
            <div className="flex justify-between gap-4 px-5">
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
                        type="button"
                        icon={Plus}
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                        onClick={handleCreate}
                    >
                        {submitLabel}
                    </Button>
                </div>
            </div>

            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <Form {...form}>
                    <div className="flex flex-col gap-4 px-5 pb-5">
                        <ContainerTemplates />
                        <ContainerBasicConfig listImages={listImages} />
                        <ContainerPorts />
                        <ContainerEnvVars />
                        <ContainerVolumes />
                    </div>
                </Form>
            </ScrollAreaWithShadow>
        </div>
    );
}
