'use client';

import { useRef } from 'react';
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
import { CardImageContainers } from '@/components/docker/image/cards/CardImageContainers';
import { TooltipTrigger } from '@radix-ui/react-tooltip';
import { Tooltip, TooltipContent } from '@workspace/ui/components/tooltip.tsx';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider.tsx';
import { NotFoundSSE } from '@/components/shared/NotFoundSSE';
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';
import { toast } from 'sonner';

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
    const forceRef = useRef(false);

    const imageName = image?.repoTags?.[0] || image?.name?.[0] || imageId.substring(0, 12);

    const handleUse = () => {
        router.push(`/docker/containers/create?image=${image?.repoTags[0]}`);
    };

    const handleRemove = () => {
        forceRef.current = false;
        openAlertDialog({
            title: tActions('image.removeTitle'),
            cancelLabel: tActions('cancel'),
            actionLabel: tActions('remove'),
            description: (
                <div className={'space-y-4'}>
                    <p className="text-muted-foreground text-sm">
                        {tActions('image.removeDescription', { name: imageName })}
                    </p>
                    <Label
                        htmlFor={'force-delete-image-detail'}
                        className={
                            'bg-muted/50 border-destructive flex cursor-pointer items-center justify-between rounded-lg border p-3'
                        }
                    >
                        <div className={'space-y-0.5'}>
                            <p className={'text-destructive text-sm font-medium'}>
                                {tActions('image.forceDelete')}
                            </p>
                            <p className={'text-xs'}>{tActions('image.forceDeleteDescription')}</p>
                        </div>
                        <Switch
                            id="force-delete-image-detail"
                            defaultChecked={false}
                            onCheckedChange={(checked) => (forceRef.current = checked)}
                        />
                    </Label>
                </div>
            ),
            onAction: async () => {
                const result = await onImageAction({
                    imageIds: [imageId],
                    action: 'delete',
                    force: forceRef.current,
                });
                if (result?.serverError) {
                    toast.error(result.serverError);
                } else if (result?.data?.deleted.includes(imageId)) {
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
            <div className="flex h-full flex-1 flex-col gap-5">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Box className="text-primary size-7" />
                    </div>
                    <div className="mt-3.5 flex flex-1 flex-col">
                        {!image ? (
                            <Skeleton className="h-9 w-40" />
                        ) : (
                            <h1 className="text-3xl font-semibold tracking-tight break-all">
                                {imageName}
                            </h1>
                        )}
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                    <div className={'mt-5 flex gap-3'}>
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
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-4 px-5 pb-5">
                        <CardImageContainers />
                        <CardImageDetails />
                        <CardImageConfig />
                        <CardImageLayers />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </BreadcrumbProvider>
    );
}
