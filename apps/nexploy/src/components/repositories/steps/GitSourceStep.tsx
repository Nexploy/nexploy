'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { BookMarked, Building2, GitBranch as GitBranchIcon } from 'lucide-react';
import { providerIcons } from '@/components/git/providerIcons';
import { useFormContext } from 'react-hook-form';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { fetcherApi } from '@/lib/api/fetcherApi';
import Link from 'next/link';
import { GitRepository } from '@workspace/typescript-interface/git/git';
import { getHostname } from '@/utils/url';

interface GitAccountSummary {
    id: string;
    provider: string;
    providerAccountId: string;
    providerUsername: string | null;
    gitProviderId: string;
    gitProvider: {
        displayName: string;
        ownerName: string | null;
        ownerType: string | null;
        baseUrl: string | null;
    };
}

export function GitSourceStep() {
    const { control, watch, setValue } = useFormContext();
    const t = useTranslations('repository.steps.gitSource');
    const tSource = useTranslations('repository.settings.source');

    const { data: accounts } = useSWR<GitAccountSummary[]>('/api/git/accounts', fetcherApi);

    const selectedAccountId = watch('gitAccountId');

    const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);

    const { data: repos, isLoading: isLoadingRepos } = useSWR<GitRepository[]>(
        selectedAccount
            ? `/api/git/repositories?provider=${selectedAccount.provider}&gitAccountId=${selectedAccount.id}`
            : null,
        fetcherApi,
    );

    const hasAccounts = accounts && accounts.length > 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex gap-2">
                    <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <GitBranchIcon className="text-primary size-5" />
                    </div>
                    <div className="flex flex-col">
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {!hasAccounts ? (
                    <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
                        <div className="text-sm">{t('noAccounts')}</div>
                        <Button asChild>
                            <Link href="/account">{t('connectAccount')}</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <FormField
                            control={control}
                            name="gitAccountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('account')}</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            const account = accounts?.find((a) => a.id === value);
                                            if (account) {
                                                setValue('gitProvider', account.provider);
                                            }
                                            setValue('repo', undefined);
                                        }}
                                        value={field.value || ''}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectAccount')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {accounts?.map((account) => {
                                                const isOrg =
                                                    account.gitProvider.ownerType ===
                                                    'Organization';
                                                const hostname = getHostname(
                                                    account.gitProvider.baseUrl,
                                                );
                                                return (
                                                    <SelectItem key={account.id} value={account.id}>
                                                        <span className="flex items-center gap-2">
                                                            {providerIcons[account.provider]}
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
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedAccount && (
                            <FormField
                                control={control}
                                name="repo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{tSource('repository')}</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                const repo = repos?.find((r) => r.id === value);
                                                if (repo) {
                                                    field.onChange(repo);
                                                    setValue('name', repo.fullName);
                                                }
                                            }}
                                            value={field.value?.id || ''}
                                            disabled={isLoadingRepos}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={
                                                            isLoadingRepos
                                                                ? tSource('loading')
                                                                : tSource('selectRepository')
                                                        }
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {repos?.map((repo) => (
                                                    <SelectItem key={repo.id} value={repo.id}>
                                                        <span className="flex items-center gap-2">
                                                            <BookMarked />
                                                            {repo.fullName || repo.name}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
