import { Fragment } from 'react';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { Trash } from 'lucide-react';
import { onImageAction } from '@/actions/docker/image/imageAction.action';
import { ImageAction, ImageTool } from '@workspace/typescript-interface/docker/docker.image';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

interface ImageDropdownActionsProps {
    imageId: string;
    imageName: string[];
}

export function ImageDropdownActions({ imageId, imageName }: ImageDropdownActionsProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const handleAction = async (action: ImageAction) => {
        await onImageAction({ imageIds: [imageId], action });
    };

    const containerTools: ImageTool[] = [
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
            disabled: !imageId,
            variant: 'destructive',
        },
    ];

    return (
        <DropdownMenuContent align="end">
            {containerTools.map((tool, index) => (
                <Fragment key={index}>
                    {tool.separator && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                        variant={tool.variant}
                        onClick={tool.action}
                        disabled={tool.disabled}
                    >
                        <tool.icon />
                        {tool.label}
                    </DropdownMenuItem>
                </Fragment>
            ))}
        </DropdownMenuContent>
    );
}
