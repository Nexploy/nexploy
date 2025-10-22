import { Fragment } from 'react';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { toast } from 'sonner';
import { Trash } from 'lucide-react';
import { onImageAction } from '@/actions/docker/image/imageAction.action';
import { ImageAction, ImageTool } from '@workspace/typescript-interface/docker.image';

interface ImageDropdownActionsProps {
    imageId?: string;
}

export function ImageDropdownActions({ imageId }: ImageDropdownActionsProps) {
    const handleAction = async (action: ImageAction) => {
        const result = await onImageAction({ imageId: imageId!, action });
        if (result?.validationErrors) {
            const globalErrors = result.validationErrors._errors;
            toast.error(globalErrors);
        }
    };

    const containerTools: ImageTool[] = [
        {
            icon: Trash,
            label: 'Remove',
            action: () => handleAction('delete'),
            disabled: !imageId,
        },
    ];

    return (
        <DropdownMenuContent align="end">
            {containerTools.map((tool, index) => (
                <Fragment key={index}>
                    {tool.separator && <DropdownMenuSeparator />}
                    <DropdownMenuItem onClick={tool.action} disabled={tool.disabled}>
                        <tool.icon />
                        {tool.label}
                    </DropdownMenuItem>
                </Fragment>
            ))}
        </DropdownMenuContent>
    );
}
