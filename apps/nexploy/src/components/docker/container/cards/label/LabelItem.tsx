import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { Pencil } from 'lucide-react';
import { Label } from '@workspace/typescript-interface/docker/docker.label';
import { useTranslations } from 'next-intl';

interface LabelItemProps {
    label: Label;
    isEdited: boolean;
    isDeleted: boolean;
    isNew?: boolean;
    displayLabel: Label;
    onEdit?: (label: Label, originalLabel?: Label) => void;
}

export function LabelItem({
    label,
    isEdited,
    isDeleted,
    isNew,
    displayLabel,
    onEdit,
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
        <div className="bg-muted/60 flex items-center justify-between gap-2 rounded-md p-2">
            <div className="flex min-w-0 flex-1 items-center gap-1">
                <code className="flex items-center gap-2 text-sm leading-none">
                    <span className="text-primary shrink-0 truncate text-xs font-semibold">
                        {displayLabel.key}:
                    </span>
                </code>
                <span className="text-xs break-all">
                    {displayLabel.value ? (
                        displayLabel.value
                    ) : (
                        <span className="text-muted-foreground italic">{t('empty')}</span>
                    )}
                </span>
                {statusIndicator}
            </div>
            {onEdit && (
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
            )}
        </div>
    );
}
