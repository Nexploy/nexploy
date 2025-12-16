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
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder={'Name'} {...field} />
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder={'Email'} {...field} />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder={'Password'} {...field} />
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
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder={'Confirm Password'}
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
                            <FormLabel>Rôle</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={'Rôle'} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        icon={Plus}
                        isLoading={action.isPending}
                        disabled={action.isPending}
                        type="submit"
                    >
                        Créer
                    </Button>
                </div>
            </form>
        </Form>
    );
}
