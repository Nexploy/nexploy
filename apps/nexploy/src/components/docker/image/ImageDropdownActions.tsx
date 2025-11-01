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

interface ImageDropdownActionsProps {
    image: Image;
}

export function ImageDropdownActions({ image }: ImageDropdownActionsProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const router = useRouter();

    const imageName = image.name ? image.name : ['<none>'];

    const handleAction = async (action: ImageAction) => {
        await onImageAction({ imageIds: [image.id], action });
    };

    const containerTools: ImageTool[] = [
        {
            icon: Play,
            label: 'Use',
            action: () =>
                router.push(`/docker/containers/add-container?image=${image.repoTags[0]}`),
            disabled: !image.repoTags.length,
            tooltipContent: !image.repoTags.length
                ? 'This image has no repository tags'
                : undefined,
        },
        {
            icon: Trash,
            label: 'Remove',
            action: () =>
                openAlertDialog({
                    title: 'Remove Images',
                    description: `Are you sure you want to remove ${imageName.join(',')} image?`,
                    cancelLabel: 'Cancel',
                    actionLabel: 'Remove',
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
                                        onClick={tool.action}
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
                            onClick={tool.action}
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
