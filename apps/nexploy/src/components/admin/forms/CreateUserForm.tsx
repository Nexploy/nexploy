'use client';

import { useTranslations } from 'next-intl';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { onCreateUserAction } from '@/actions/auth/createUser.action';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { Plus } from 'lucide-react';

export function CreateUserForm() {
    const tValidation = useTranslations('validation');
    const t = useTranslations('admin');
    const { onSuccess } = useConfirmationDialogStore();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onCreateUserAction,
        zodResolver(createUserFormSchema(tValidation)),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'user',
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
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('name')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('name')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('email')}</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder={t('email')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('password')}</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder={t('password')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('confirmPassword')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder={t('confirmPassword')}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('role')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('role')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="user">{t('userRole')}</SelectItem>
                                    <SelectItem value="admin">{t('adminRole')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {form.formState.errors.root?.message && (
                    <span className={'text-destructive mb-4 flex text-sm'}>
                        {form.formState.errors.root?.message}
                    </span>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        icon={Plus}
                        isLoading={action.isPending}
                        disabled={action.isPending}
                        type="submit"
                    >
                        {t('createUser')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
