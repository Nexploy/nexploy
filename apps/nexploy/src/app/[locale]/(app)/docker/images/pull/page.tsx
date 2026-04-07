'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Download, Info, LayoutList } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { onImagePullAction } from '@/actions/docker/image/imagePullAction.action';
import { imagePullSchema } from '@workspace/schemas-zod/docker/image/imagePullAction.schema';
import { Alert, AlertTitle } from '@workspace/ui/components/alert';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { ImageNameConfig } from '@/components/docker/image/pull/ImageNameConfig';
import { PopularImages } from '@/components/docker/image/pull/PopularImages';

export default function AddImagePage() {
    const t = useTranslations('docker.pullImagePage');
    const router = useRouter();
    const searchParams = useSearchParams();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onImagePullAction,
        zodResolver(imagePullSchema),
        {
            formProps: {
                defaultValues: {
                    imageName: searchParams.get('imageName') ?? '',
                },
            },
            actionProps: {
                onExecute: ({ input }) => {
                    toast.loading(t('downloadingImage', { name: input.imageName }), {
                        id: 'downloadingImage',
                    });
                },
                onSuccess: ({ data }) => {
                    if (data) router.push(`/docker/images/${data.imageId}`);
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
                    <div className="flex justify-between gap-4 px-5">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                                <LayoutList className="text-primary size-7" />
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
                                <Download />
                                {isSubmitting ? t('downloading') : t('downloadButton')}
                            </Button>
                        </div>
                    </div>

                    <Alert variant="info" className="mx-5 mt-5 mb-4 w-auto">
                        <Info />
                        <AlertTitle>{t('rateLimitInfo')}</AlertTitle>
                    </Alert>

                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="flex flex-col gap-4 overflow-hidden px-5 pb-5">
                            <ImageNameConfig />
                            <PopularImages />
                        </div>
                    </ScrollAreaWithShadow>
                </form>
            </Form>
        </div>
    );
}
