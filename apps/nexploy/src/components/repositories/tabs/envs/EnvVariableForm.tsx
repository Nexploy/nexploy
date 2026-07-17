'use client';

import { useState } from 'react';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@workspace/ui/components/form';
import { Eye, EyeOff } from 'lucide-react';
import { onEnvVariableAction } from '@/actions/repository/updateEnvVariables.action';
import { envVariableSchema } from '@workspace/schemas-zod/repository/envVariable.schema';
import { toast } from 'sonner';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';

interface EnvVariable {
    id?: string;
    key: string;
    value: string;
}

interface EnvVariableFormProps {
    repositoryId: string;
    stageId: string;
    variable?: EnvVariable;
}

export function EnvVariableForm({ repositoryId, stageId, variable }: EnvVariableFormProps) {
    const t = useTranslations('repository.settings.envVars');
    const { onSuccess } = useConfirmationDialogStore();
    const [showValue, setShowValue] = useState(false);
    const isEdit = !!variable?.id;

    const { form, handleSubmitWithAction } = useHookFormAction(
        onEnvVariableAction,
        zodResolver(envVariableSchema),
        {
            formProps: {
                defaultValues: {
                    repositoryId,
                    stageId,
                    envVariables: [variable ?? { key: '', value: '' }],
                    deleteIds: [],
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    toast.success(isEdit ? t('updated') : t('created'));
                    if (onSuccess) onSuccess(data);
                },
            },
        },
    );

    const isSubmitting = form.formState.isSubmitting;

    return (
        <Form {...form}>
            <form
                onSubmit={handleSubmitWithAction}
                className="flex flex-col gap-4"
                autoComplete="off"
            >
                <FormField
                    control={form.control}
                    name="envVariables.0.key"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('key')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    autoComplete="off"
                                    placeholder={t('keyPlaceholder')}
                                    className="font-mono"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="envVariables.0.value"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('value')}</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        {...field}
                                        autoComplete="new-password"
                                        type={showValue ? 'text' : 'password'}
                                        placeholder={t('valuePlaceholder')}
                                        className="pr-10 font-mono"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="xs"
                                        className="absolute right-1 top-1/2 -translate-y-1/2"
                                        onClick={() => setShowValue((v) => !v)}
                                    >
                                        {showValue ? <Eye /> : <EyeOff />}
                                    </Button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
                        {isEdit ? t('saveChanges') : t('addVariable')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
