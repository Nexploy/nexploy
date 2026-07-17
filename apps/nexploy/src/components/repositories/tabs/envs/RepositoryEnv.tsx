'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { Eye, EyeOff, Key, Pencil, Plus, Trash2 } from 'lucide-react';
import { onEnvVariableAction } from '@/actions/repository/updateEnvVariables.action';
import { deleteEnvVariableAction } from '@/actions/repository/deleteEnvVariable.action';
import { toast } from 'sonner';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
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
    const [copiedId, setCopiedId] = useState<string | null>(null);

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
            content: (
                <EnvVariableForm
                    repositoryId={repositoryId}
                    stageId={stageId}
                    variable={variable}
                />
            ),
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

    const toggleShowValue = (id: string) => {
        setShowValues((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <Card className="mx-5">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardHeaderWithIcon
                        as={'div'}
                        icon={Key}
                        title={t('title')}
                        description={t('description')}
                    />
                    {canEdit && (
                        <div className="flex items-center gap-2">
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
                            <Button size="sm" onClick={handleAddNew}>
                                <Plus />
                                {t('addVariable')}
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {envVariables.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center text-sm">
                        {t('noVariables')}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="text-muted-foreground border-b py-2 text-sm font-medium">
                            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-center gap-4">
                                <span>{t('key')}</span>
                                <span>{t('value')}</span>
                            </div>
                        </div>
                        {envVariables.map((variable, index) => {
                            const rowId = variable.id ?? `idx-${index}`;
                            const isVisible = showValues[rowId];
                            return (
                                <div
                                    key={rowId}
                                    className="group grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-center gap-4 border-b py-3 transition-colors last:border-0"
                                >
                                    <code className="min-w-0 truncate text-sm">{variable.key}</code>
                                    <div className="flex min-w-0 items-center gap-1">
                                        <CopyButton
                                            className="size-8 shrink-0"
                                            size="icon"
                                            variant="ghost"
                                            text={variable.value}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 shrink-0"
                                            title={isVisible ? t('hide') : t('show')}
                                            onClick={() => toggleShowValue(rowId)}
                                        >
                                            {isVisible ? <Eye /> : <EyeOff />}
                                        </Button>
                                        <code className="text-muted-foreground min-w-0 flex-1 break-all font-mono text-sm">
                                            {isVisible ? (
                                                variable.value
                                            ) : (
                                                <span className="tracking-[0.2em]">
                                                    ▪▪▪▪▪▪▪▪▪▪
                                                </span>
                                            )}
                                        </code>
                                        {canEdit && (
                                            <div className="ml-auto flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => handleEdit(variable)}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => handleRemove(variable)}
                                                >
                                                    <Trash2 className="text-destructive size-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
