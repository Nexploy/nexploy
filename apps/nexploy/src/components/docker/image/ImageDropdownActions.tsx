import { Fragment } from 'react';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Play, Trash } from 'lucide-react';
import { onImageAction } from '@/actions/docker/image/imageAction.action';
import { Image, ImageAction, ImageTool } from '@workspace/typescript-interface/docker/docker.image';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface ImageDropdownActionsProps {
    image: Image;
}

export function ImageDropdownActions({ image }: ImageDropdownActionsProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const router = useRouter();
    const t = useTranslations('docker.dropdownActions');

    const imageName = image.name ? image.name : ['<none>'];

    const handleAction = async (action: ImageAction) => {
        await onImageAction({ imageIds: [image.id], action });
    };

    const containerTools: ImageTool[] = [
        {
            icon: Play,
            label: t('use'),
            onClick: () =>
                router.push(`/docker/containers/create-container?image=${image.repoTags[0]}`),
            disabled: !image.repoTags.length,
            tooltipContent: !image.repoTags.length
                ? t('image.noRepositoryTags')
                : undefined,
        },
        {
            icon: Trash,
            label: t('remove'),
            onClick: () =>
                openAlertDialog({
                    title: t('image.removeTitle'),
                    description: t('image.removeDescription', { name: imageName.join(',') }),
                    cancelLabel: t('cancel'),
                    actionLabel: t('remove'),
                    onAction: () => handleAction('delete'),
                }),
            disabled: !image.id,
            variant: 'destructive',
        },
    ];

    return (
        <DropdownMenuContent align="end">
            {containerTools.map((tool, index) => (
                <Fragment key={index}>
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
                        <DropdownMenuItem
                            variant={tool.variant}
                            onClick={tool.onClick}
                            disabled={tool.disabled}
                        >
                            <tool.icon />
                            {tool.label}
                        </DropdownMenuItem>
                    )}
                </Fragment>
            ))}
        </DropdownMenuContent>
    );
}
