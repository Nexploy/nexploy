'use client';

import { Box, Play, Trash } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useImageStore } from '../../../stores/docker/useImageStore';
import { CardImageDetails } from '@/components/docker/image/cards/CardImageDetails';
import { CardImageLayers } from '@/components/docker/image/cards/CardImageLayers';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { onImageAction } from '@/actions/docker/image/imageAction.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { CardImageConfig } from '@/components/docker/image/cards/CardImageConfig';
import { TooltipTrigger } from '@radix-ui/react-tooltip';
import { Tooltip, TooltipContent } from '@workspace/ui/components/tooltip.tsx';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider.tsx';
import { NotFoundSSE } from '@/components/shared/NotFoundSSE';

interface ImageDetailPageProps {
    imageId: string;
}

export function ImageDetailPage({ imageId }: ImageDetailPageProps) {
    const t = useTranslations('docker.imageDetail');
    const tActions = useTranslations('docker.dropdownActions');

    const image = useImageStore((state) => state.image);
    const notFound = useImageStore((state) => state.notFound);
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const router = useRouter();

    const imageName = image?.repoTags?.[0] || image?.name?.[0] || imageId.substring(0, 12);

    const handleUse = () => {
        router.push(`/docker/containers/create?image=${image?.repoTags[0]}`);
    };

    const handleRemove = () => {
        openAlertDialog({
            title: tActions('image.removeTitle'),
            description: tActions('image.removeDescription', { name: imageName }),
            cancelLabel: tActions('cancel'),
            actionLabel: tActions('remove'),
            onAction: async () => {
                const result = await onImageAction({ imageIds: [imageId], action: 'delete' });
                if (result?.data?.deleted.includes(imageId)) {
                    router.push('/docker/images');
                }
            },
        });
    };

    if (notFound) {
        return (
            <NotFoundSSE
                title={t('notFoundTitle')}
                description={t('notFoundDescription')}
                backLabel={t('backToImages')}
            />
        );
    }

    return (
        <BreadcrumbProvider segments={{ imageId: imageName }}>
            <div className="flex h-full flex-1 flex-col gap-5 pt-5">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Box className="text-primary size-7" />
                    </div>
                    <div className="flex flex-1 flex-col">
                        {!image ? (
                            <Skeleton className="h-6 w-40" />
                        ) : (
                            <h1 className="text-3xl leading-none font-semibold tracking-tight break-all">
                                {imageName}
                            </h1>
                        )}
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="icon" onClick={handleUse} disabled={!image}>
                                <Play className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('useImage')}</TooltipContent>
                    </Tooltip>
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleRemove}
                        disabled={!image}
                    >
                        <Trash className="size-4" />
                    </Button>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-5 px-5 pb-5">
                        <CardImageDetails />
                        <CardImageConfig />
                        <CardImageLayers />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </BreadcrumbProvider>
    );
}
