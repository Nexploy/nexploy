'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { Autocomplete, type AutocompleteOption } from '@workspace/ui/components/autocomplete';
import { DicebearAvatar } from '@/components/shared/DicebearAvatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Info } from 'lucide-react';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { inviteMemberAction } from '@/actions/organization/inviteMember.action';
import { zodResolver } from '@hookform/resolvers/zod';
import { inviteMemberSchema } from '@workspace/schemas-zod/organization/inviteMember.schema';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useOrganizationMembersStore } from '@/stores/organization/useOrganizationMembersStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { fetcherApi } from '@/lib/api/fetcherApi';
import useSWR from 'swr';
import type { InvitableUser } from '@workspace/typescript-interface/organization/organization';
import { toast } from 'sonner';

interface InviteMemberFormProps {
    organizationId: string;
}

export function InviteMemberForm({ organizationId }: InviteMemberFormProps) {
    const t = useTranslations('organization');
    const { closeDialog } = useConfirmationDialogStore();
    const addInvitation = useOrganizationMembersStore((s) => s.addInvitation);

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search);

    const searchQuery = debouncedSearch.trim();

    const { data: users = [], isLoading } = useSWR<InvitableUser[]>(
        searchQuery
            ? {
                  url: `/api/organizations/${organizationId}/members/search-users?q=${encodeURIComponent(searchQuery)}`,
                  disableToast: true,
              }
            : null,
        fetcherApi,
        { keepPreviousData: true },
    );

    const isSearching = isLoading || search.trim() !== searchQuery;

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
                onSuccess: ({ data, input }) => {
                    if (data) {
                        addInvitation({
                            id: data.id,
                            email: input.email,
                            role: input.role,
                            createdAt: new Date(),
                        });
                    }
                    toast.success(t('success.invited'));
                    closeDialog();
                },
            },
        },
    );

    const options = useMemo<AutocompleteOption[]>(
        () =>
            users.map((user) => ({
                value: user.email,
                label: user.email,
                description: user.name,
                icon: <DicebearAvatar seed={user.email} size={24} alt={user.name} />,
            })),
        [users],
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
                                <Autocomplete
                                    name={field.name}
                                    options={options}
                                    inputValue={search}
                                    onInputValueChange={(value) => {
                                        setSearch(value);
                                        field.onChange(value);
                                    }}
                                    value={field.value}
                                    onValueChange={(value) => field.onChange(value)}
                                    onBlur={field.onBlur}
                                    isLoading={isSearching}
                                    minQueryLength={1}
                                    placeholder={t('members.searchPlaceholder')}
                                    emptyMessage={t('members.noUserFound')}
                                    autoFocus
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
                                <FormLabel>{t('members.role')}</FormLabel>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="size-3.5 cursor-help text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-64 space-y-2 p-3">
                                        <div>
                                            <p className="font-semibold">{t('roles.member')}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {t('roleDescriptions.member')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-semibold">{t('roles.admin')}</p>
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
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent align="start">
                                    <SelectItem value="member">{t('roles.member')}</SelectItem>
                                    <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {form.formState.errors.root?.message && (
                    <span className={'mb-4 flex text-destructive text-sm'}>{form.formState.errors.root?.message}</span>
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
