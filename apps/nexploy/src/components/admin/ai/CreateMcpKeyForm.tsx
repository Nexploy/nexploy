'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { createMcpApiKeySchema } from '@workspace/schemas-zod/ai/mcpApiKey.schema';
import { createMcpApiKeyAction } from '@/actions/admin/ai/createMcpApiKey.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { KeyRevealContent } from '@/components/admin/ai/KeyRevealContent.tsx';

export function CreateMcpKeyForm() {
    const t = useTranslations('ai.admin.mcp');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { closeDialog } = useConfirmationDialogStore();
    const openAlertDialog = useAlertConfirmationDialogStore((s) => s.openAlertDialog);

    const { form, handleSubmitWithAction } = useHookFormAction(
        createMcpApiKeyAction,
        zodResolver(createMcpApiKeySchema),
        {
            formProps: { defaultValues: { name: '' } },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (!data?.key) return;
                    closeDialog();
                    toast.success(t('keyCreatedSuccess'));
                    router.refresh();
                    openAlertDialog({
                        title: t('generateKey'),
                        description: <KeyRevealContent value={data.key} />,
                        cancelLabel: tCommon('close'),
                        disableActionButton: true,
                    });
                },
                onError: () => toast.error(t('keyCreatedFailed')),
            },
        },
    );

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('keyNameLabel')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('keyNamePlaceholder')} autoFocus {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={closeDialog}>
                        {tCommon('cancel')}
                    </Button>
                    <Button type="submit" isLoading={form.formState.isSubmitting}>
                        {t('generateKey')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
