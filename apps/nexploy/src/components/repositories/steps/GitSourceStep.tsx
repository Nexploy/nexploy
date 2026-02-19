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
import { BookMarked, Building2, GitBranch as GitBranchIcon, Github, Gitlab } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { fetcherApi } from '@/lib/api/fetcherApi';
import Link from 'next/link';
import { GitBranch, GitRepository } from '@workspace/typescript-interface/git/git';

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
    };
}

const providerIcons: Record<string, React.ReactNode> = {
    github: <Github className="size-4" />,
    gitlab: <Gitlab className="size-4" />,
};

export function GitSourceStep() {
    const { control, watch, setValue } = useFormContext();
    const t = useTranslations('repository.steps.gitSource');
    const tSource = useTranslations('repository.settings.source');

    const { data: accounts } = useSWR<GitAccountSummary[]>('/api/git/accounts', fetcherApi);

    const selectedAccountId = watch('gitAccountId');
    const selectedRepo = watch('repo');

    const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);

    const { data: repos, isLoading: isLoadingRepos } = useSWR<GitRepository[]>(
        selectedAccount
            ? `/api/git/repositories?provider=${selectedAccount.provider}&gitAccountId=${selectedAccount.id}`
            : null,
        fetcherApi,
    );

    const { data: branches, isLoading: isLoadingBranches } = useSWR<GitBranch[]>(
        selectedRepo && selectedAccount
            ? `/api/git/branches?provider=${selectedAccount.provider}&gitAccountId=${selectedAccount.id}&repoId=${selectedRepo.id}&owner=${selectedRepo.fullName.split('/')[0]}&repoName=${selectedRepo.fullName.split('/')[1]}`
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
                                            setValue('branch', 'main');
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
                                                return (
                                                    <SelectItem key={account.id} value={account.id}>
                                                        <span className="flex items-center gap-2">
                                                            {providerIcons[account.provider]}
                                                            <span>
                                                                {account.providerUsername ??
                                                                    account.providerAccountId}
                                                            </span>
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
                                                    setValue('branch', repo.defaultBranch);
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

                        {selectedRepo && selectedAccount && (
                            <FormField
                                control={control}
                                name="branch"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{tSource('branch')}</FormLabel>
                                        <Select
                                            value={branches ? field.value : ''}
                                            onValueChange={field.onChange}
                                            disabled={isLoadingBranches}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="min-w-32">
                                                    <SelectValue placeholder={field.value} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {branches?.map((branch) => (
                                                    <SelectItem
                                                        key={branch.name}
                                                        value={branch.name}
                                                    >
                                                        {branch.name}
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
