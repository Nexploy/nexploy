import { Pencil, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';

export type EnvVar = { key: string; value: string };

export interface EnvVarItemProps {
    env: EnvVar;
    isEdited: boolean;
    isDeleted: boolean;
    isNew?: boolean;
    displayEnvVar: EnvVar;
    onEdit?: (envVar: EnvVar, originalEnvVar?: EnvVar) => void;
    onCancelDelete?: () => void;
}

export function EnvVarItem({
    env,
    isEdited,
    isDeleted,
    isNew,
    displayEnvVar,
    onEdit,
    onCancelDelete,
}: EnvVarItemProps) {
    const t = useTranslations('docker.containerEnv');
    const statusIndicator = isNew ? (
        <span className="text-green-500">+</span>
    ) : isEdited ? (
        <span className="text-primary">*</span>
    ) : isDeleted ? (
        <span className="text-destructive">-</span>
    ) : null;

    return (
        <div className="bg-muted/60 flex items-center justify-between gap-2 rounded-md p-2">
            <code className="flex gap-2 text-sm leading-none">
                <span className="text-primary shrink-0 text-xs font-semibold">
                    {displayEnvVar.key}:
                </span>
                <span className="text-xs break-all">
                    {displayEnvVar.value ? (
                        displayEnvVar.value
                    ) : (
                        <span className="text-muted-foreground italic">{t('empty')}</span>
                    )}
                </span>
                {statusIndicator}
            </code>
            <div className="flex shrink-0 gap-1">
                {isDeleted && onCancelDelete ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={onCancelDelete}
                            >
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
                                    className="h-6 w-6"
                                    onClick={() => onEdit(displayEnvVar, isNew ? undefined : env)}
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
