'use client';

import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Shield } from 'lucide-react';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { twoFactorAuthSchema } from '@workspace/schemas-zod/auth/twoFactorAuth.schema';
import { onTwoFactorAuthEnableAction } from '@/actions/docker/auth/twoFactorAuthEnable.action';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

export function TwoFactorEnabledForm() {
    const tValidation = useTranslations('validation');
    const { onSuccess } = useConfirmationDialogStore();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onTwoFactorAuthEnableAction,
        zodResolver(twoFactorAuthSchema(tValidation)),
        {
            formProps: {
                defaultValues: {
                    password: '',
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data && onSuccess) onSuccess(data);
                },
            },
        },
    );

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel htmlFor="enable-password">Password</FormLabel>
                            <FormControl>
                                <Input
                                    id="enable-password"
                                    type="password"
                                    placeholder="Enter your password"
                                    className="w-full"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button
                    type="submit"
                    icon={Shield}
                    isLoading={action.isPending}
                    disabled={action.isPending || !form.formState.isDirty}
                    className="w-full"
                >
                    Enable 2FA
                </Button>
            </form>
        </Form>
    );
}
