'use client';

import { Box, Play, Trash } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useImageStore } from '@/stores/docker/useImageStore';
import { CardImageDetails } from '@/components/docker/image/cards/CardImageDetails';
import { CardImageLayers } from '@/components/docker/image/cards/CardImageLayers';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { onImageAction } from '@/actions/docker/image/imageAction.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { CardImageConfig } from '@/components/docker/image/cards/CardImageConfig';

interface ImageDetailPageProps {
    imageId: string;
}

export function ImageDetailPage({ imageId }: ImageDetailPageProps) {
    const t = useTranslations('docker.imageDetail');
    const tActions = useTranslations('docker.dropdownActions');

    const image = useImageStore((state) => state.getImage(imageId));
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
                await onImageAction({ imageIds: [imageId], action: 'delete' });
                router.push('/docker/images');
            },
        });
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-5">
            <div className="flex gap-3 px-5">
                <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                    <Box className="text-primary size-7" />
                </div>
                <div className="mt-3.5 flex flex-1 flex-col">
                    {!image ? (
                        <Skeleton className="h-6 w-40" />
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <h1 className="line-clamp-1 text-3xl font-semibold tracking-tight break-all">
                                    {imageName}
                                </h1>
                            </TooltipTrigger>
                            <TooltipContent className={'max-w-md break-all'}>
                                {imageName}
                            </TooltipContent>
                        </Tooltip>
                    )}
                    <p className="text-muted-foreground text-sm">{t('description')}</p>
                </div>
                <div className="mt-5 flex shrink-0 items-start gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                onClick={handleUse}
                                disabled={!image?.repoTags?.length}
                            >
                                <Play className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('useImage')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="destructive" size="icon" onClick={handleRemove}>
                                <Trash className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('deleteImage')}</TooltipContent>
                    </Tooltip>
                </div>
            </div>
            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <div className="flex flex-col gap-5 px-5 pb-5">
                    <CardImageDetails imageId={imageId} />
                    <CardImageConfig imageId={imageId} />
                    <CardImageLayers imageId={imageId} />
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
