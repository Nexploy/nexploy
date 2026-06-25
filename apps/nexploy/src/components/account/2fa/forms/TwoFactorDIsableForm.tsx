'use client';

import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { twoFactorAuthSchema } from '@workspace/schemas-zod/auth/twoFactorAuth.schema';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { onTwoFactorAuthDisableAction } from '@/actions/auth/twoFactorAuthDisable.action';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { useRouter } from 'next/navigation';

export function TwoFactorDisableForm() {
    const t = useTranslations('account.twoFactor');
    const { closeDialog } = useConfirmationDialogStore();
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onTwoFactorAuthDisableAction,
        zodResolver(twoFactorAuthSchema),
        {
            formProps: {
                defaultValues: {
                    password: '',
                },
            },
            actionProps: {
                onSuccess: () => {
                    closeDialog();
                    router.refresh();
                },
            },
        },
    );

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="mt-1 space-y-4">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input
                                    id="enable-password"
                                    type="password"
                                    placeholder={t('passwordPlaceholder')}
                                    className="w-full"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button
                        type="submit"
                        variant={'destructive'}
                        isLoading={action.isPending}
                        disabled={action.isPending || !form.formState.isDirty}
                    >
                        {t('disable')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
