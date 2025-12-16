'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from '@workspace/ui/components/input-otp';
import { CheckCircle2 } from 'lucide-react';
import { twoFactorAuthCodeSchema } from '@workspace/schemas-zod/auth/twoFactorAuth.schema';
import { useRouter } from '@/i18n/navigation';
import { twoFactorAuthUseBackupCodeAction } from '@/actions/auth/twoFactorAuthUseBackupCode.action';

interface TwoFactoVerifCodeFormProps {
    onSuccess?: () => void;
}

export function TwoFactorUseBackupCodeForm({ onSuccess }: TwoFactoVerifCodeFormProps) {
    const tValidation = useTranslations('validation');
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        twoFactorAuthUseBackupCodeAction,
        zodResolver(twoFactorAuthCodeSchema(tValidation)),
        {
            formProps: {
                defaultValues: {
                    code: '',
                    trustDevice: false,
                },
            },
            actionProps: {
                onSuccess: () => {
                    if (onSuccess) onSuccess();
                    router.refresh();
                },
            },
        },
    );

    return (
        <Form {...form}>
            <form className={'space-y-6'} onSubmit={handleSubmitWithAction}>
                <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormControl>
                                <div className={'flex flex-1 justify-center'}>
                                    <InputOTP {...field} maxLength={10}>
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                        </InputOTPGroup>
                                        <InputOTPSeparator />
                                        <InputOTPGroup>
                                            <InputOTPSlot index={5} />
                                            <InputOTPSlot index={6} />
                                            <InputOTPSlot index={7} />
                                            <InputOTPSlot index={8} />
                                            <InputOTPSlot index={9} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    icon={CheckCircle2}
                    isLoading={action.isPending}
                    disabled={action.isPending || !form.formState.isDirty}
                    className="w-full"
                >
                    Use backup code
                </Button>
            </form>
        </Form>
    );
}
