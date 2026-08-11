'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { updateBuildRunnerSchema } from '@workspace/schemas-zod/buildRunner/buildRunner.schema';
import type { BuildRunnerInfo } from '@workspace/typescript-interface/buildRunner/buildRunner';
import { updateBuildRunnerAction } from '@/actions/admin/buildRunner/updateBuildRunner.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Switch } from '@workspace/ui/components/switch';
import { DialogFooter } from '@workspace/ui/components/dialog';

interface EditBuildRunnerFormProps {
    runner: BuildRunnerInfo;
}

export function EditBuildRunnerForm({ runner }: EditBuildRunnerFormProps) {
    const t = useTranslations('admin.buildRunners');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { closeDialog } = useConfirmationDialogStore();

    const { form, handleSubmitWithAction } = useHookFormAction(
        updateBuildRunnerAction,
        zodResolver(updateBuildRunnerSchema),
        {
            formProps: {
                defaultValues: {
                    id: runner.id,
                    name: runner.name,
                    description: runner.description ?? '',
                    labels: runner.labels.join(', '),
                    maxConcurrency: runner.maxConcurrency,
                    enabled: runner.enabled,
                },
            },
            actionProps: {
                onSuccess: () => {
                    closeDialog();
                    toast.success(t('updateSuccess'));
                    router.refresh();
                },
            },
        },
    );

    const isSubmitting = form.formState.isSubmitting;

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('nameLabel')}</FormLabel>
                            <FormControl>
                                <Input disabled={isSubmitting} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('descriptionLabel')}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={t('descriptionPlaceholder')}
                                    disabled={isSubmitting}
                                    {...field}
                                    value={field.value ?? ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="labels"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('labelsLabel')}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={t('labelsPlaceholder')}
                                    disabled={isSubmitting}
                                    {...field}
                                    value={field.value ?? ''}
                                />
                            </FormControl>
                            <p className="text-muted-foreground text-xs">{t('labelsDescription')}</p>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="maxConcurrency"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('concurrencyLabel')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min={1}
                                    max={64}
                                    disabled={isSubmitting}
                                    {...field}
                                    value={String(field.value ?? 2)}
                                />
                            </FormControl>
                            <p className="text-muted-foreground text-xs">{t('concurrencyDescription')}</p>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <FormLabel className={'cursor-pointer'}>
                                <div className="flex flex-col gap-0.5">
                                    <span>{t('enabledLabel')}</span>
                                    <p className="text-muted-foreground text-xs">{t('enabledDescription')}</p>
                                </div>
                                <FormControl>
                                    <Switch
                                        className={'cursor-pointer'}
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                            </FormLabel>
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <Button variant="outline" type="button" onClick={closeDialog}>
                        {tCommon('cancel')}
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {t('save')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
