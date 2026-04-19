import { Fragment, useRef } from 'react';
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
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';

interface ImageDropdownActionsProps {
    image: Image;
}

export function ImageDropdownActions({ image }: ImageDropdownActionsProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const router = useRouter();
    const t = useTranslations('docker.dropdownActions');
    const forceRef = useRef(false);

    const imageName = image.name ? image.name : ['<none>'];

    const handleAction = async (action: ImageAction) => {
        await onImageAction({ imageIds: [image.id], action, force: forceRef.current });
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
            icon: Trash,
            label: t('remove'),
            onClick: () => {
                forceRef.current = false;
                openAlertDialog({
                    title: t('image.removeTitle'),
                    cancelLabel: t('cancel'),
                    actionLabel: t('remove'),
                    description: (
                        <div className="space-y-3">
                            <p className="text-muted-foreground text-sm">
                                {t('image.removeDescription', { name: imageName.join(', ') })}
                            </p>
                            <div className="flex items-center gap-3">
                                <Switch
                                    id="force-delete-image"
                                    defaultChecked={false}
                                    onCheckedChange={(checked) => {
                                        forceRef.current = checked;
                                    }}
                                />
                                <div>
                                    <Label htmlFor="force-delete-image" className="font-medium">
                                        {t('image.forceDelete')}
                                    </Label>
                                    <p className="text-muted-foreground text-xs">
                                        {t('image.forceDeleteDescription')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ),
                    onAction: () => handleAction('delete'),
                });
            },
            disabled: !image.id || image.containersUsed > 0,
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
