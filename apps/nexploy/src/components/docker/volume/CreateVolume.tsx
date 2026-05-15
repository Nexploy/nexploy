'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, HardDrive, Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { onVolumeCreateAction } from '@/actions/docker/volume/volumeCreate.action';
import { volumeCreateSchema } from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { useTranslations } from 'next-intl';
import { VolumeBasicConfig } from '@/components/docker/volume/create/VolumeBasicConfig';
import { VolumeDriverOptions } from '@/components/docker/volume/create/VolumeDriverOptions';
import { VolumeLabels } from '@/components/docker/volume/create/VolumeLabels';

export default function CreateVolume() {
    const t = useTranslations('docker.createVolumePage');
    const tValidation = useTranslations('validation');
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onVolumeCreateAction,
        zodResolver(volumeCreateSchema(tValidation)),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    driver: 'local',
                    driverOpts: [],
                    labels: [],
                },
            },
            actionProps: {
                onSuccess: () => {
                    router.push('/docker/volumes');
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    return (
        <div className="flex h-full flex-1 flex-col gap-5">
            <Form {...form}>
                <form
                    className="flex flex-1 flex-col overflow-hidden"
                    onSubmit={handleSubmitWithAction}
                >
                    <div className="mb-5 flex justify-between gap-4 px-5">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                                <HardDrive className="text-primary size-7" />
                            </div>
                            <div className="mt-3.5 flex flex-col">
                                <h1 className="text-3xl font-semibold tracking-tight">
                                    {t('title')}
                                </h1>
                                <p className="text-muted-foreground text-sm">{t('description')}</p>
                            </div>
                        </div>
                        <div className="mt-5 flex gap-3">
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
                                {isSubmitting ? t('creating') : t('createButton')}
                            </Button>
                        </div>
                    </div>

                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="flex flex-col gap-4 px-5 pb-5">
                            <VolumeBasicConfig />
                            <VolumeDriverOptions />
                            <VolumeLabels />
                        </div>
                    </ScrollAreaWithShadow>
                </form>
            </Form>
        </div>
    );
}
