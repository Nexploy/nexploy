'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Eye, EyeOff, Key, Pencil, Plus, Trash2 } from 'lucide-react';
import { onEnvVariableAction } from '@/actions/repository/updateEnvVariables.action';
import { deleteEnvVariableAction } from '@/actions/repository/deleteEnvVariable.action';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { ImportEnv } from './ImportEnv';
import { EnvVariableForm } from './EnvVariableForm';
import { usePermissions } from '@/contexts/PermissionContext';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import CopyButton from '@/components/shared/CopyButton.tsx';

interface EnvVariable {
    id?: string;
    key: string;
    value: string;
}

interface RepositoryEnvTabProps {
    repositoryId: string;
    stageId: string;
    envVariables: EnvVariable[];
}

export function RepositoryEnv({ repositoryId, stageId, envVariables }: RepositoryEnvTabProps) {
    const router = useRouter();
    const t = useTranslations('repository.settings.envVars');
    const { can } = usePermissions();
    const canEdit = can('environment', 'update');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});

    const rowIds = useMemo(() => envVariables.map((variable, index) => variable.id ?? `idx-${index}`), [envVariables]);
    const areAllVisible = rowIds.length > 0 && rowIds.every((rowId) => showValues[rowId]);

    const { execute: importVariables } = useAction(onEnvVariableAction, {
        onSuccess: () => {
            router.refresh();
        },
    });

    const handleAddNew = () => {
        openDialog({
            title: t('addTitle'),
            description: t('addDescription'),
            content: <EnvVariableForm repositoryId={repositoryId} stageId={stageId} />,
            onSuccess: () => {
                closeDialog();
                router.refresh();
            },
        });
    };

    const handleEdit = (variable: EnvVariable) => {
        openDialog({
            title: t('editTitle'),
            description: t('editDescription', { key: variable.key }),
            content: <EnvVariableForm repositoryId={repositoryId} stageId={stageId} variable={variable} />,
            onSuccess: () => {
                closeDialog();
                router.refresh();
            },
        });
    };

    const handleRemove = (variable: EnvVariable) => {
        if (!variable.id) return;
        openAlertDialog({
            title: t('removeTitle'),
            description: t('removeDescription', { key: variable.key || t('keyPlaceholder') }),
            cancelLabel: t('cancel'),
            actionLabel: t('remove'),
            onAction: async () => {
                const result = await deleteEnvVariableAction({
                    repositoryId,
                    envVariableId: variable.id!,
                });
                if (!result?.serverError) {
                    toast.success(t('removeSuccess'));
                    router.refresh();
                }
            },
        });
    };

    const toggleShowValue = (rowId: string) => {
        setShowValues((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
    };

    const toggleShowAll = () => {
        setShowValues(areAllVisible ? {} : Object.fromEntries(rowIds.map((rowId) => [rowId, true])));
    };

    return (
        <div className="flex flex-col gap-2 px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{t('title')}</h2>
                    {envVariables.length > 0 && (
                        <Badge variant="secondary" className="font-mono">
                            {envVariables.length}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {envVariables.length > 0 && (
                        <Button variant="outline" size="sm" icon={areAllVisible ? EyeOff : Eye} onClick={toggleShowAll}>
                            {areAllVisible ? t('hideAll') : t('showAll')}
                        </Button>
                    )}
                    {canEdit && (
                        <>
                            <ImportEnv
                                onImport={(vars) => {
                                    importVariables({
                                        repositoryId,
                                        stageId,
                                        envVariables: vars,
                                        deleteIds: [],
                                    });
                                }}
                            />
                            <Button size="sm" icon={Plus} onClick={handleAddNew}>
                                {t('addVariable')}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {envVariables.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-md border p-8 text-center">
                    <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
                        <Key className="text-primary size-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{t('noVariables')}</span>
                        <span className="text-muted-foreground text-sm">{t('description')}</span>
                    </div>
                    {canEdit && (
                        <Button variant="outline" size="sm" icon={Plus} onClick={handleAddNew}>
                            {t('addVariable')}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col divide-y overflow-hidden rounded-md border">
                    {envVariables.map((variable, index) => {
                        const rowId = rowIds[index]!;
                        const isVisible = showValues[rowId];
                        return (
                            <div
                                key={rowId}
                                className="bg-card hover:bg-muted/70 group flex items-center gap-3 p-3 transition-colors"
                            >
                                <code className="w-1/3 min-w-0 shrink-0 break-all font-mono text-sm font-medium">
                                    {variable.key}
                                </code>
                                <code className="text-muted-foreground min-w-0 flex-1 break-all font-mono text-sm">
                                    {isVisible ? (
                                        variable.value || <span className="italic">{t('emptyValue')}</span>
                                    ) : (
                                        <span className="tracking-[0.2em]">•••••••••••••••••••</span>
                                    )}
                                </code>
                                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 has-[[data-state=open]]:opacity-100">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => toggleShowValue(rowId)}
                                            >
                                                {isVisible ? <EyeOff /> : <Eye />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{isVisible ? t('hide') : t('show')}</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <CopyButton size="icon-sm" variant="ghost" text={variable.value} />
                                        </TooltipTrigger>
                                        <TooltipContent>{t('copy')}</TooltipContent>
                                    </Tooltip>
                                    {canEdit && (
                                        <>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => handleEdit(variable)}
                                                    >
                                                        <Pencil />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t('editTitle')}</TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="destructiveGhost"
                                                        size="icon-sm"
                                                        onClick={() => handleRemove(variable)}
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t('remove')}</TooltipContent>
                                            </Tooltip>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
