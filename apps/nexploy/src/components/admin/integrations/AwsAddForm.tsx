'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { addAwsAccountAction } from '@/actions/aws/addAccount.action';
import { awsAddAccountSchema } from '@workspace/schemas-zod/aws/aws.schema';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function AwsAddForm() {
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.aws');

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        addAwsAccountAction,
        zodResolver(awsAddAccountSchema),
        {
            formProps: {
                defaultValues: {
                    displayName: '',
                    accessKeyId: '',
                    secretAccessKey: '',
                    region: '',
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('addedSuccess'));
                    closeDialog();
                },
                onError: ({ error }) => {
                    toast.error(error.serverError ?? t('addFailed'));
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('displayName')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('displayNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="accessKeyId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('accessKeyIdLabel')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('accessKeyIdPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="secretAccessKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('secretAccessKeyLabel')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder={t('secretAccessKeyPlaceholder')}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('regionLabel')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('regionPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                        className="w-full"
                    >
                        {t('add')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
