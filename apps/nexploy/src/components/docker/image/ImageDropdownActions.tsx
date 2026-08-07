import React, { Fragment, useRef } from 'react';
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@workspace/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Download, Play, Tag, TagsIcon, Trash2, Upload } from 'lucide-react';
import { ImagePushForm } from '@/components/docker/image/actions/ImagePushForm';
import { ImageTagForm } from '@/components/docker/image/actions/ImageTagForm';
import { ImageUntagForm } from '@/components/docker/image/actions/ImageUntagForm';
import { downloadImageArchive } from '@/components/docker/image/actions/downloadImageArchive';
import { onImageAction } from '@/actions/docker/image/imageAction.action';
import { Image, ImageTool } from '@workspace/typescript-interface/docker/docker.image';
import type { ImageActionInput } from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';
import { toast } from 'sonner';
import { useProtectionTooltip } from '@/hooks/useProtectionTooltip';

interface ImageDropdownActionsProps {
    image: Image;
}

export function ImageDropdownActions({ image }: ImageDropdownActionsProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const router = useRouter();
    const t = useTranslations('docker.dropdownActions');
    const tImage = useTranslations('docker.imageActions');
    const forceRef = useRef(false);
    const openDialog = useConfirmationDialogStore((state) => state.openDialog);
    const manage = useProtectionTooltip('image.manage');
    const remove = useProtectionTooltip('image.remove');

    const imageName = image.name;

    const handleAction = async (action: ImageActionInput) => {
        const result = await onImageAction({ imageIds: [image.id], action, force: forceRef.current });
        if (result?.serverError) {
            toast.error(result.serverError);
        }
    };

    const containerTools: ImageTool[] = [
        {
            icon: Play,
            label: t('use'),
            onClick: () => router.push(`/docker/containers/create?image=${image.repoTags[0]}`),
            disabled: !image.repoTags.length,
            tooltipContent: !image.repoTags.length ? t('image.noRepositoryTags') : undefined,
        },
        {
            icon: Tag,
            label: tImage('tag'),
            disabled: manage.blocked,
            tooltipContent: manage.tooltip,
            onClick: () =>
                openDialog({
                    title: tImage('tagTitle'),
                    description: tImage('tagDescription'),
                    content: <ImageTagForm image={image} />,
                }),
            separator: true,
        },
        {
            icon: TagsIcon,
            label: tImage('untag'),
            onClick: () =>
                openDialog({
                    title: tImage('untagTitle'),
                    description: tImage('untagDescription'),
                    content: <ImageUntagForm image={image} />,
                }),
            disabled: manage.blocked || image.repoTags.length <= 1,
            tooltipContent: manage.tooltip ?? (image.repoTags.length <= 1 ? tImage('untagLastTagWarning') : undefined),
        },
        {
            icon: Upload,
            label: tImage('push'),
            onClick: () =>
                openDialog({
                    title: tImage('pushTitle'),
                    description: tImage('pushDescription'),
                    content: <ImagePushForm image={image} />,
                }),
            disabled: manage.blocked || !image.repoTags.length,
            tooltipContent: manage.tooltip ?? (!image.repoTags.length ? t('image.noRepositoryTags') : undefined),
        },
        {
            icon: Download,
            label: tImage('save'),
            onClick: () => downloadImageArchive([image.id]),
            disabled: manage.blocked,
            tooltipContent: manage.tooltip,
        },
        {
            icon: Trash2,
            label: t('remove'),
            onClick: () => {
                forceRef.current = false;
                openAlertDialog({
                    title: t('image.removeTitle'),
                    cancelLabel: t('cancel'),
                    actionLabel: t('remove'),
                    description: (
                        <div className={'space-y-4'}>
                            <p className="text-muted-foreground text-sm">
                                {t('image.removeDescription', { name: imageName.join(', ') })}
                            </p>
                            <Label
                                htmlFor={'force-delete-images'}
                                className={
                                    'bg-muted/50 border-destructive flex cursor-pointer items-center justify-between rounded-lg border p-3'
                                }
                            >
                                <div className={'space-y-0.5'}>
                                    <p className={'text-destructive text-sm font-medium'}>{t('image.forceDelete')}</p>
                                    <p className={'text-xs'}>{t('image.forceDeleteDescription')}</p>
                                </div>
                                <Switch
                                    id="force-delete-images"
                                    defaultChecked={false}
                                    onCheckedChange={(checked) => (forceRef.current = checked)}
                                />
                            </Label>
                        </div>
                    ),
                    onAction: () => handleAction('delete'),
                });
            },
            disabled: remove.blocked || !image.id || image.containersUsed > 0,
            tooltipContent: remove.tooltip,
            variant: 'destructive',
        },
    ];

    return (
        <DropdownMenuContent align="end">
            {containerTools.map((tool) => (
                <Fragment key={tool.label}>
                    {tool.separator && <DropdownMenuSeparator />}
                    {tool.tooltipContent ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <DropdownMenuItem
                                        variant={tool.variant}
                                        onClick={tool.onClick}
                                        disabled={tool.disabled}
                                    >
                                        <tool.icon />
                                        {tool.label}
                                    </DropdownMenuItem>
                                </div>
                            </TooltipTrigger>
                            {tool.tooltipContent && (
                                <TooltipContent>
                                    <p>{tool.tooltipContent}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    ) : (
                        <DropdownMenuItem variant={tool.variant} onClick={tool.onClick} disabled={tool.disabled}>
                            <tool.icon />
                            {tool.label}
                        </DropdownMenuItem>
                    )}
                </Fragment>
            ))}
        </DropdownMenuContent>
    );
}
