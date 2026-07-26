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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { BookMarked, GitBranch as GitBranchIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { fetcherApi } from '@/lib/api/fetcherApi';
import Link from 'next/link';
import { GitAccountSummary, GitRepositoryList } from '@workspace/typescript-interface/git/git';
import { GitAccountFormField } from '@/components/git/GitAccountFormField';

export function GitSourceStep() {
    const { control, setValue } = useFormContext();
    const t = useTranslations('repository.steps.gitSource');
    const tSource = useTranslations('repository.settings.source');

    const [selectedAccount, setSelectedAccount] = useState<GitAccountSummary | undefined>();

    const { data, isLoading: isLoadingRepos } = useSWR<GitRepositoryList>(
        selectedAccount
            ? {
                  url: `/api/git/repositories?provider=${selectedAccount.provider}&gitAccountId=${selectedAccount.id}`,
              }
            : null,
        fetcherApi,
    );

    const repos = data?.repositories;
    const hasNoRepository = !!data && data.totalCount === 0;
    const allRepositoriesAlreadyAdded = !!data && data.totalCount > 0 && repos?.length === 0;
    const emptyMessage = hasNoRepository
        ? tSource('noRepositoryOnAccount')
        : allRepositoriesAlreadyAdded
          ? tSource('allRepositoriesAlreadyAdded')
          : null;

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
                <GitAccountFormField
                    onValueChange={(_, account) => {
                        setValue('gitProvider', account.provider);
                        setValue('repo', undefined);
                        setSelectedAccount(account);
                    }}
                    noAccountsContent={
                        <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
                            <div className="text-sm">{t('noAccounts')}</div>
                            <Button asChild>
                                <Link href="/account#integrations">{t('connectAccount')}</Link>
                            </Button>
                        </div>
                    }
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
                                                        : (emptyMessage ??
                                                          tSource('selectRepository'))
                                                }
                                            />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {emptyMessage ? (
                                            <div className="text-muted-foreground px-2 py-6 text-center text-sm">
                                                {emptyMessage}
                                            </div>
                                        ) : (
                                            <SelectGroup>
                                                <SelectLabel>{tSource('repository')}</SelectLabel>
                                                {repos?.map((repo) => (
                                                    <SelectItem key={repo.id} value={repo.id}>
                                                        <span className="flex items-center gap-2">
                                                            <BookMarked />
                                                            {repo.fullName || repo.name}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </CardContent>
        </Card>
    );
}
