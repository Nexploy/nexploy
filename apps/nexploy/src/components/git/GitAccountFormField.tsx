'use client';

import { ReactNode } from 'react';
import { Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import useSWR from 'swr';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Badge } from '@workspace/ui/components/badge';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { PROVIDER_ICONS } from '@/components/git/providerIcons';
import { getHostname } from '@/utils/url';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { GitAccountSummary } from '@workspace/typescript-interface/git/git';

interface GitAccountFormFieldProps {
    onValueChange?: (value: string, account: GitAccountSummary) => void;
    noAccountsContent?: ReactNode;
}

export function GitAccountFormField({
    onValueChange,
    noAccountsContent,
}: GitAccountFormFieldProps) {
    const t = useTranslations('repository.steps.gitSource');
    const { control } = useFormContext();

    const { data: accounts, isLoading } = useSWR<GitAccountSummary[]>(
        { url: '/api/git/accounts' },
        fetcherApi,
    );

    if (isLoading) return <Skeleton className="h-9 w-52" />;

    if (!accounts?.length) return <>{noAccountsContent}</>;

    return (
        <FormField
            control={control}
            name="gitAccountId"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('account')}</FormLabel>
                    <Select
                        value={field.value || ''}
                        onValueChange={(value) => {
                            field.onChange(value);
                            if (onValueChange) {
                                const account = accounts.find((a) => a.id === value);
                                if (account) onValueChange(value, account);
                            }
                        }}
                    >
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={t('selectAccount')} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{t('account')}</SelectLabel>
                                {accounts.map((account) => {
                                    const isOrg = account.gitProvider.ownerType === 'Organization';
                                    const hostname = getHostname(account.gitProvider.baseUrl);
                                    const ProviderIcon = PROVIDER_ICONS[account.provider];
                                    return (
                                        <SelectItem key={account.id} value={account.id}>
                                            <span className="flex items-center gap-2">
                                                <ProviderIcon className="size-5" />
                                                <span>
                                                    {account.providerUsername ??
                                                        account.providerAccountId}
                                                </span>
                                                {hostname && (
                                                    <span className="text-muted-foreground text-xs">
                                                        {hostname}
                                                    </span>
                                                )}
                                                {isOrg && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="gap-1 py-0 text-xs"
                                                    >
                                                        <Building2 className="size-3" />
                                                        {account.gitProvider.ownerName}
                                                    </Badge>
                                                )}
                                            </span>
                                        </SelectItem>
                                    );
                                })}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
