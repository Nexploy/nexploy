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
import { inviteMemberAction } from '@/actions/organization/inviteMember.action';
import { zodResolver } from '@hookform/resolvers/zod';
import { inviteMemberSchema } from '@workspace/schemas-zod/organization/inviteMember.schema';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface InviteMemberFormProps {
    organizationId: string;
}

export function InviteMemberForm({ organizationId }: InviteMemberFormProps) {
    const t = useTranslations('organization');
    const { closeDialog } = useConfirmationDialogStore();
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        inviteMemberAction,
        zodResolver(inviteMemberSchema),
        {
            formProps: {
                defaultValues: {
                    organizationId,
                    email: '',
                    role: 'member',
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('success.invited'));
                    closeDialog();
                    router.refresh();
                },
            },
        },
    );

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('members.email')}</FormLabel>
                            <FormControl>
                                <Input {...field} type="email" placeholder="teammate@example.com" />
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
                            <FormLabel>{t('members.role')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="member">{t('roles.member')}</SelectItem>
                                    <SelectItem value="admin">{t('roles.admin')}</SelectItem>
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
                    <Button isLoading={action.isPending} disabled={action.isPending} type="submit">
                        {t('members.invite')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
