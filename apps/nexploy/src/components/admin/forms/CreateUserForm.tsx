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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { onCreateUserAction } from '@/actions/auth/createUser.action';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { Info, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { toast } from 'sonner';

export function CreateUserForm() {
    const t = useTranslations('admin');
    const { closeDialog } = useConfirmationDialogStore();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onCreateUserAction,
        zodResolver(createUserFormSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'readWrite',
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('userAddedSuccess'));
                    closeDialog();
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
                            <div className="flex items-center gap-1.5">
                                <FormLabel>{t('role')}</FormLabel>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="text-muted-foreground size-3.5 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-64 space-y-2 p-3">
                                        <div>
                                            <p className="font-semibold">{t('readRole')}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {t('roleDescriptions.read')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-semibold">{t('readWriteRole')}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {t('roleDescriptions.readWrite')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-semibold">{t('adminRole')}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {t('roleDescriptions.admin')}
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('role')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('role')}</SelectLabel>
                                        <SelectItem value="read">{t('readRole')}</SelectItem>
                                        <SelectItem value="readWrite">
                                            {t('readWriteRole')}
                                        </SelectItem>
                                        <SelectItem value="admin">{t('adminRole')}</SelectItem>
                                    </SelectGroup>
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
