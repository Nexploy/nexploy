'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { createBuildRunnerSchema } from '@workspace/schemas-zod/buildRunner/buildRunner.schema';
import { createBuildRunnerAction } from '@/actions/admin/buildRunner/createBuildRunner.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { RunnerTokenPanel } from '@/components/admin/servers/RunnerTokenPanel';

interface CreateBuildRunnerFormProps {
    serverUrl: string;
}

export function CreateBuildRunnerForm({ serverUrl }: CreateBuildRunnerFormProps) {
    const t = useTranslations('admin.buildRunners');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { closeDialog } = useConfirmationDialogStore();
    const openAlertDialog = useAlertConfirmationDialogStore((s) => s.openAlertDialog);

    const { form, handleSubmitWithAction } = useHookFormAction(
        createBuildRunnerAction,
        zodResolver(createBuildRunnerSchema),
        {
            formProps: {
                defaultValues: { name: '', description: '', labels: '', maxConcurrency: 2 },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (!data?.token) return;

                    closeDialog();
                    toast.success(t('createSuccess'));
                    router.refresh();
                    openAlertDialog({
                        title: t('tokenTitle'),
                        description: (
                            <RunnerTokenPanel token={data.token} runnerName={data.name} serverUrl={serverUrl} />
                        ),
                        cancelLabel: tCommon('close'),
                        disableActionButton: true,
                        props: { className: 'sm:max-w-3xl' },
                    });
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
                                <Input
                                    placeholder={t('namePlaceholder')}
                                    autoFocus
                                    disabled={isSubmitting}
                                    {...field}
                                />
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

                <DialogFooter>
                    <Button variant="outline" type="button" onClick={closeDialog}>
                        {tCommon('cancel')}
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {t('create')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
