'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, HardDrive, Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { onVolumeCreateAction } from '@/actions/docker/volume/volumeCreate.action';
import { toast } from 'sonner';
import { volumeCreateSchema } from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { useTranslations } from 'next-intl';
import { VolumeBasicConfig } from '@/components/docker/volume/create/VolumeBasicConfig';
import { VolumeDriverOptions } from '@/components/docker/volume/create/VolumeDriverOptions';
import { VolumeLabels } from '@/components/docker/volume/create/VolumeLabels';

export default function CreateVolumePage() {
    const t = useTranslations('docker.createVolumePage');
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onVolumeCreateAction,
        zodResolver(volumeCreateSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    driver: 'local',
                    driverOpts: {},
                    labels: {},
                },
            },
            actionProps: {
                onExecute: ({ input }) => {
                    toast.loading(t('creatingVolume', { name: input.name }));
                },
                onSuccess: () => {
                    toast.dismiss();
                    router.push('/docker/volumes');
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <Form {...form}>
                <form
                    className="flex flex-1 flex-col gap-5 overflow-hidden"
                    onSubmit={handleSubmitWithAction}
                >
                    <div className="flex justify-between gap-4 px-5">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                                <HardDrive className="text-primary size-7" />
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
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                            >
                                <ArrowLeft />
                                {t('back')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                <Plus />
                                {isSubmitting ? t('creating') : t('createButton')}
                            </Button>
                        </div>
                    </div>

                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="flex flex-col gap-4 overflow-hidden px-5 pb-5">
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
