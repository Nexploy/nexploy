import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogClose, DialogFooter } from '@workspace/ui/components/dialog';
import { Plus, Save, Trash } from 'lucide-react';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import { EnvFormProps } from '@workspace/typescript-interface/docker/docker.env';
import {
    ContainerEnvForm,
    containerEnvSchema,
} from '@workspace/schemas-zod/docker/container/containerEnv.schema';
import { useTranslations } from 'next-intl';

export function EnvForm({ mode, defaultEnvVar, originalEnvVar }: EnvFormProps) {
    const { closeDialog } = useConfirmationDialogStore();
    const { onEnvVarChange } = useContainerChangesStore();
    const t = useTranslations('docker.forms');

    const form = useForm<ContainerEnvForm>({
        resolver: zodResolver(containerEnvSchema),
        defaultValues: {
            key: defaultEnvVar?.key ?? '',
            value: defaultEnvVar?.value ?? '',
        },
    });

    const onSubmit = (data: ContainerEnvForm) => {
        if (mode === 'add') {
            onEnvVarChange({
                typeAction: 'add',
                key: data.key,
                value: data.value,
            });
        } else if (mode === 'edit') {
            const referenceEnv = originalEnvVar ?? defaultEnvVar;

            onEnvVarChange({
                typeAction: 'edit',
                key: data.key,
                value: data.value,
                currentKey: referenceEnv?.key,
                currentValue: referenceEnv?.value,
            });
        }

        closeDialog();
    };

    const handleDelete = () => {
        if (!defaultEnvVar) return;
        const referenceEnv = originalEnvVar ?? defaultEnvVar;

        onEnvVarChange({
            typeAction: 'delete',
            currentKey: referenceEnv?.key,
            currentValue: referenceEnv?.value,
        });

        closeDialog();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('key')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder={t('keyPlaceholder')} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('value')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder={t('valuePlaceholder')} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter className={'flex !justify-between pt-4'}>
                    {mode === 'edit' && (
                        <Button
                            size={'icon'}
                            type="button"
                            variant="destructive"
                            icon={Trash}
                            onClick={handleDelete}
                        />
                    )}
                    <div className={'flex flex-1 flex-row justify-end gap-2'}>
                        <DialogClose asChild>
                            <Button variant={'outline'}>{t('cancel')}</Button>
                        </DialogClose>
                        <Button
                            className={'flex-1 sm:flex-0'}
                            type="submit"
                            disabled={!form.formState.isDirty}
                            icon={mode === 'add' ? Plus : Save}
                        >
                            {mode === 'add' ? t('add') : t('edit')}
                        </Button>
                    </div>
                </DialogFooter>
            </form>
        </Form>
    );
}
