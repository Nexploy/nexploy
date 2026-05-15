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
import { onEnvVariableAction } from '@/actions/repository/envVariable.action';
import { envVariableSchema } from '@workspace/schemas-zod/repository/envVariable.schema';
import { toast } from 'sonner';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import { ImportEnv } from './ImportEnv';

interface EnvVariable {
    id?: string;
    key: string;
    value: string;
}

interface RepositoryEnvTabProps {
    repositoryId: string;
    envVariables: EnvVariable[];
}

export function RepositoryEnv({
    repositoryId,
    envVariables: initialEnvVariables,
}: RepositoryEnvTabProps) {
    const router = useRouter();
    const t = useTranslations('repository.settings.envVars');
    const tValidation = useTranslations('validation');
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});
    const bottomRef = useRef<HTMLDivElement>(null);

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onEnvVariableAction,
        zodResolver(envVariableSchema(tValidation)),
        {
            formProps: {
                defaultValues: {
                    repositoryId,
                    envVariables: initialEnvVariables,
                    deleteIds: [],
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('updated'));
                    router.refresh();

                    form.reset({
                        repositoryId,
                        envVariables: form.getValues('envVariables'),
                        deleteIds: [],
                    });
                },
                onError: ({ error }) => {
                    toast.error(error.serverError || t('updateError'));
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';
    const envVariables = form.watch('envVariables');
    const deletedIds = form.watch('deleteIds');

    const handleAddNew = () => {
        const currentEnvs = form.getValues('envVariables');
        form.setValue('envVariables', [
            ...currentEnvs,
            {
                key: '',
                value: '',
            },
        ]);
        setTimeout(
            () => bottomRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' }),
            0,
        );
    };

    const handleRemove = (index: number) => {
        const currentEnvs = form.getValues('envVariables');
        const env = currentEnvs[index];

        if (env?.id) {
            const deleted = new Set(form.getValues('deleteIds') ?? []);
            deleted.add(env.id);
            form.setValue('deleteIds', Array.from(deleted), { shouldDirty: true });
        }

        form.setValue(
            'envVariables',
            currentEnvs.filter((_, i) => i !== index),
            { shouldDirty: true },
        );
    };

    const handleUndoDelete = (id?: string) => {
        if (!id) return;

        const deleted = new Set(form.getValues('deleteIds') ?? []);
        deleted.delete(id);
        form.setValue('deleteIds', Array.from(deleted), { shouldDirty: true });

        const originalEnv = initialEnvVariables.find((e) => e.id === id);
        if (originalEnv) {
            const currentEnvs = form.getValues('envVariables');
            form.setValue('envVariables', [...currentEnvs, originalEnv], { shouldDirty: true });
        }
    };

    const toggleShowValue = (index: number) => {
        setShowValues((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const deletedIdsSet = new Set(deletedIds);
    const deletedEnvs = initialEnvVariables.filter((env) => env.id && deletedIdsSet.has(env.id));
    const hasChanges = form.formState.isDirty || deletedIdsSet.size > 0;

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
                    <div className="flex gap-2">
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
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                                {t('saveChanges')}
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="space-y-2">
                        {envVariables.length === 0 ? (
                            <div className="text-muted-foreground py-8 text-center text-sm">
                                {t('noVariables')}
                            </div>
                        ) : (
                            envVariables.map((env, index) => (
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
                                                                placeholder={t('valuePlaceholder')}
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
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        onClick={() => handleRemove(index)}
                                    >
                                        <Trash2 className="text-destructive size-4" />
                                    </Button>
                                </div>
                            ))
                        )}

                        {deletedEnvs.length > 0 && (
                            <div className="border-t pt-4">
                                <p className="text-muted-foreground mb-2 text-sm">
                                    {t('pendingDeletion')}
                                </p>
                                {deletedEnvs.map((env) => (
                                    <div
                                        key={env.id}
                                        className="bg-destructive/10 flex items-center justify-between rounded-md p-2"
                                    >
                                        <span className="font-mono text-sm line-through">
                                            {env.key}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            type="button"
                                            onClick={() => handleUndoDelete(env.id)}
                                        >
                                            {t('undo')}
                                        </Button>
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
