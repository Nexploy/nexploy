'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { User } from 'lucide-react';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { InputGroup, InputGroupInput } from '@workspace/ui/components/input-group';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { useTranslations } from 'next-intl';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { onChangeUsernameAction } from '@/actions/auth/changeUsername.action';
import { changeUsernameFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { Session } from '@/lib/auth/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ProfileInfoFormProps {
    user?: Session['user'];
}

export function ProfileInfoForm({ user }: ProfileInfoFormProps) {
    const t = useTranslations('account.profileInfo');
    const router = useRouter();

    const { form, handleSubmitWithAction } = useHookFormAction(
        onChangeUsernameAction,
        zodResolver(changeUsernameFormSchema),
        {
            formProps: {
                defaultValues: {
                    newName: user?.name ?? '',
                },
            },
            actionProps: {
                onSuccess: ({ input }) => {
                    toast.success(t('profileUpdated'));
                    router.refresh();
                    form.reset({
                        newName: input.newName,
                    });
                },
            },
        },
    );

    return (
        <Card id="profile">
            <CardHeaderWithIcon
                icon={User}
                title={t('title')}
                description={t('description')}
            />
            <CardContent className="space-y-4">
                <Form {...form}>
                    <form className={'flex flex-col gap-4'} onSubmit={handleSubmitWithAction}>
                        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="newName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('username')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormItem>
                                <FormLabel>{t('email')}</FormLabel>
                                <FormControl>
                                    <InputGroup className={'cursor-not-allowed'}>
                                        <InputGroupInput
                                            disabled
                                            defaultValue={user?.email}
                                            readOnly
                                        />
                                    </InputGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </div>
                        <Button
                            type="submit"
                            disabled={!form.formState.isDirty}
                            className={'self-end'}
                        >
                            {t('updateProfile')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
