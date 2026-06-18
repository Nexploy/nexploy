'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { Form, FormControl, FormField, FormItem } from '@workspace/ui/components/form';
import { Eye, EyeOff, Key, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { onEnvVariableAction } from '@/actions/repository/updateEnvVariables.action';
import { deleteEnvVariableAction } from '@/actions/repository/deleteEnvVariable.action';
import { envVariableSchema } from '@workspace/schemas-zod/repository/envVariable.schema';
import { toast } from 'sonner';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import { ImportEnv } from './ImportEnv';
import { usePermissions } from '@/contexts/PermissionContext';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

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
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});
    const bottomRef = useRef<HTMLDivElement>(null);

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onEnvVariableAction,
        zodResolver(envVariableSchema),
        {
            formProps: {
                defaultValues: {
                    repositoryId,
                    stageId,
                    envVariables,
                    deleteIds: [],
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('updated'));
                    form.reset({
                        repositoryId,
                        stageId,
                        envVariables,
                        deleteIds: [],
                    });
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    const handleAddNew = () => {
        const currentEnvs = form.getValues('envVariables');
        form.setValue('envVariables', [...currentEnvs, { key: '', value: '' }]);
        setTimeout(
            () => bottomRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' }),
            0,
        );
    };

    const handleRemove = (index: number) => {
        const currentEnvs = form.getValues('envVariables');
        const env = currentEnvs[index];
        if (!env) return;

        const key = env.key || t('keyPlaceholder');

        if (!env.id) {
            form.setValue(
                'envVariables',
                currentEnvs.filter((_, i) => i !== index),
                { shouldDirty: true },
            );
            return;
        }

        openAlertDialog({
            title: t('removeTitle'),
            description: t('removeDescription', { key }),
            cancelLabel: t('cancel'),
            actionLabel: t('remove'),
            onAction: async () => {
                const result = await deleteEnvVariableAction({
                    repositoryId,
                    envVariableId: env.id!,
                });
                if (result?.serverError) {
                    toast.error(result.serverError);
                    return;
                }
                form.setValue(
                    'envVariables',
                    currentEnvs.filter((_, i) => i !== index),
                    { shouldDirty: false },
                );
                toast.success(t('removeSuccess'));
                router.refresh();
            },
        });
    };

    const toggleShowValue = (index: number) => {
        setShowValues((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const hasChanges = form.formState.isDirty;

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
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <>
                                <ImportEnv
                                    onImport={(vars) => {
                                        const currentEnvs = form.getValues('envVariables');
                                        form.setValue('envVariables', [...currentEnvs, ...vars], {
                                            shouldDirty: true,
                                        });
                                    }}
                                />
                                <Button variant="outline" size="sm" onClick={handleAddNew}>
                                    <Plus />
                                    {t('addVariable')}
                                </Button>
                                {hasChanges && (
                                    <Button
                                        size="sm"
                                        onClick={handleSubmitWithAction}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="animate-spin" />
                                        ) : (
                                            <Save />
                                        )}
                                        {t('saveChanges')}
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction}>
                        {envVariables.length === 0 ? (
                            <div className="text-muted-foreground py-8 text-center text-sm">
                                {t('noVariables')}
                            </div>
                        ) : (
                            <div className={'flex flex-col gap-2'}>
                                {envVariables.map((_, index) => (
                                    <div key={index} className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <FormField
                                                control={form.control}
                                                name={`envVariables.${index}.key`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                autoComplete="off"
                                                                placeholder={t('keyPlaceholder')}
                                                                className="font-mono"
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <FormField
                                                control={form.control}
                                                name={`envVariables.${index}.value`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    {...field}
                                                                    type={
                                                                        showValues[index]
                                                                            ? 'text'
                                                                            : 'password'
                                                                    }
                                                                    autoComplete="off"
                                                                    placeholder={t(
                                                                        'valuePlaceholder',
                                                                    )}
                                                                    className="pr-10 font-mono"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute top-1/2 right-1 -translate-y-1/2"
                                                                    onClick={() =>
                                                                        toggleShowValue(index)
                                                                    }
                                                                >
                                                                    {showValues[index] ? (
                                                                        <Eye />
                                                                    ) : (
                                                                        <EyeOff />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        {canEdit && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                type="button"
                                                onClick={() => handleRemove(index)}
                                            >
                                                <Trash2 className="text-destructive size-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
