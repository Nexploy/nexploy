'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@workspace/ui/components/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { CheckCircle2 } from 'lucide-react';
import { twoFactorAuthVerifCodeAction } from '@/actions/auth/twoFactorAuthVerifCode.action';
import { twoFactorAuthCodeSchema } from '@workspace/schemas-zod/auth/twoFactorAuth.schema';
import { useRouter } from 'next/navigation';

interface TwoFactoVerifCodeFormProps {
    onSuccess?: () => void;
}

export function TwoFactorVerifCodeForm({ onSuccess }: TwoFactoVerifCodeFormProps) {
    const t = useTranslations('auth.twoFactor');
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        twoFactorAuthVerifCodeAction,
        zodResolver(twoFactorAuthCodeSchema),
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
                                    <InputOTP {...field} maxLength={6} pattern={REGEXP_ONLY_DIGITS}>
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} className="text-md size-10" />
                                            <InputOTPSlot index={1} className="text-md size-10" />
                                            <InputOTPSlot index={2} className="text-md size-10" />
                                            <InputOTPSlot index={3} className="text-md size-10" />
                                            <InputOTPSlot index={4} className="text-md size-10" />
                                            <InputOTPSlot index={5} className="text-md size-10" />
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
                    {t('submit')}
                </Button>
            </form>
        </Form>
    );
}
