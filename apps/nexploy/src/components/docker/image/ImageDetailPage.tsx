'use client';

import { Box, Download, Trash } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { useImageStore } from '@/stores/docker/useImageStore';
import { CardImageDetails } from '@/components/docker/image/cards/CardImageDetails';
import { CardImageConfig } from '@/components/docker/image/cards/CardImageConfig';
import { CardImageLayers } from '@/components/docker/image/cards/CardImageLayers';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { onImageAction } from '@/actions/docker/image/imageAction.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

interface ImageDetailPageProps {
    imageId: string;
}

export function ImageDetailPage({ imageId }: ImageDetailPageProps) {
    const image = useImageStore((state) => state.getImage(imageId));
    const t = useTranslations('docker.imageDetail');
    const tActions = useTranslations('docker.dropdownActions');
    const router = useRouter();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const imageName = image?.repoTags?.[0] || image?.name?.[0] || imageId.substring(0, 12);

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
        <div className="relative flex h-full flex-1 flex-col gap-5 pt-5">
            <div className="flex gap-3 px-5">
                <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                    <Box className="text-primary size-7" />
                </div>
                <div className="flex flex-1 flex-col">
                    {!image ? (
                        <Skeleton className="h-6 w-40" />
                    ) : (
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            {imageName}
                        </h1>
                    )}
                    <p className="text-muted-foreground text-sm">{t('description')}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Download className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('exportImage')}</TooltipContent>
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
                    <CardImageDetails image={image} />
                    <CardImageConfig imageId={imageId} />
                    <CardImageLayers imageId={imageId} />
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
