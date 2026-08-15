import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { Lock, Pencil, X } from 'lucide-react';
import { Label } from '@workspace/typescript-interface/docker/docker.label';
import { useTranslations } from 'next-intl';

interface LabelItemProps {
    label: Label;
    isEdited: boolean;
    isDeleted: boolean;
    isNew?: boolean;
    isProtected?: boolean;
    displayLabel: Label;
    onEdit?: (label: Label, originalLabel?: Label) => void;
    onCancelDelete?: () => void;
}

export function LabelItem({
    label,
    isEdited,
    isDeleted,
    isNew,
    isProtected,
    displayLabel,
    onEdit,
    onCancelDelete,
}: LabelItemProps) {
    const t = useTranslations('docker.labels');
    const statusIndicator = isNew ? (
        <span className="text-green-500">+</span>
    ) : isEdited ? (
        <span className="text-primary">*</span>
    ) : isDeleted ? (
        <span className="text-destructive">-</span>
    ) : null;

    return (
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted/60 p-2">
            <div className="flex min-w-0 flex-1 items-center gap-1">
                <code className="flex items-center gap-2 text-sm leading-none">
                    <span className="shrink-0 truncate font-semibold text-primary text-xs">{displayLabel.key}:</span>
                </code>
                <span className="break-all text-xs">
                    {displayLabel.value ? (
                        displayLabel.value
                    ) : (
                        <span className="text-muted-foreground italic">{t('empty')}</span>
                    )}
                </span>
                {statusIndicator}
            </div>
            <div className="flex shrink-0 gap-1">
                {isProtected ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground">
                                <Lock className="size-4" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>{t('protected')}</TooltipContent>
                    </Tooltip>
                ) : isDeleted && onCancelDelete ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={onCancelDelete}>
                                <X />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('cancelDelete')}</TooltipContent>
                    </Tooltip>
                ) : (
                    onEdit && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 shrink-0"
                                    onClick={() => onEdit(displayLabel, isNew ? undefined : label)}
                                >
                                    <Pencil />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('edit')}</TooltipContent>
                        </Tooltip>
                    )
                )}
            </div>
        </div>
    );
}
