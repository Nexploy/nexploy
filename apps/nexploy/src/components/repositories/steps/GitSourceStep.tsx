'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@workspace/ui/components/command';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { BookMarked, Check, ChevronDown, GitBranch as GitBranchIcon, PlugZap } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { fetcherApi } from '@/lib/api/fetcherApi';
import Link from 'next/link';
import { GitAccountSummary, GitRepositoryList } from '@workspace/typescript-interface/git/git';
import { GitAccountFormField } from '@/components/git/GitAccountFormField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { CustomGitSource } from '@/components/repositories/steps/CustomGitSource';
import { EmptyState } from '@/components/shared/EmptyState';

export function GitSourceStep() {
    const { control, setValue } = useFormContext();
    const t = useTranslations('repository.steps.gitSource');
    const tSource = useTranslations('repository.settings.source');

    const [selectedAccount, setSelectedAccount] = useState<GitAccountSummary | undefined>();
    const [isRepoPopoverOpen, setIsRepoPopoverOpen] = useState(false);

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
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <GitBranchIcon className="size-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Tabs
                    defaultValue="account"
                    onValueChange={(value) => {
                        setValue('repo', undefined);
                        setValue('name', '');

                        if (value === 'custom') {
                            setSelectedAccount(undefined);
                            return;
                        }

                        setValue('gitProvider', undefined);
                        setValue('gitAccountId', undefined);
                    }}
                >
                    <TabsList>
                        <TabsTrigger value="account">{t('modeAccount')}</TabsTrigger>
                        <TabsTrigger value="custom">{t('modeCustom')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="custom" className="pt-4">
                        <CustomGitSource />
                    </TabsContent>

                    <TabsContent value="account" className="space-y-4 pt-4">
                        <GitAccountFormField
                            onValueChange={(_, account) => {
                                setValue('gitProvider', account.provider);
                                setValue('repo', undefined);
                                setSelectedAccount(account);
                            }}
                            noAccountsContent={
                                <EmptyState
                                    icon={PlugZap}
                                    title={t('noAccounts')}
                                    className="border-dashed"
                                    action={
                                        <Button asChild size="sm">
                                            <Link href="/account#integrations">{t('connectAccount')}</Link>
                                        </Button>
                                    }
                                />
                            }
                        />

                        {selectedAccount && (
                            <FormField
                                control={control}
                                name="repo"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{tSource('repository')}</FormLabel>
                                        <Popover open={isRepoPopoverOpen} onOpenChange={setIsRepoPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={isRepoPopoverOpen}
                                                        disabled={isLoadingRepos || !!emptyMessage}
                                                        className="w-fit justify-between font-normal"
                                                    >
                                                        <span
                                                            className={cn(
                                                                'flex items-center gap-2 truncate',
                                                                !field.value && 'text-muted-foreground',
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                <>
                                                                    <BookMarked className="size-4 shrink-0" />
                                                                    {field.value.fullName || field.value.name}
                                                                </>
                                                            ) : isLoadingRepos ? (
                                                                tSource('loading')
                                                            ) : (
                                                                (emptyMessage ?? tSource('selectRepository'))
                                                            )}
                                                        </span>
                                                        <ChevronDown className="size-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0" align="start">
                                                <Command>
                                                    <CommandInput
                                                        className="px-2"
                                                        placeholder={tSource('searchRepository')}
                                                    />
                                                    <ScrollAreaWithShadow viewportClassName="h-auto max-h-[300px] w-full">
                                                        <CommandList className="max-h-none overflow-visible">
                                                            <CommandEmpty>{tSource('noRepositoryFound')}</CommandEmpty>
                                                            <CommandGroup>
                                                                {repos?.map((repo) => (
                                                                    <CommandItem
                                                                        key={repo.id}
                                                                        value={repo.fullName || repo.name}
                                                                        className={'mr-2'}
                                                                        onSelect={() => {
                                                                            field.onChange(repo);
                                                                            setValue('name', repo.fullName);
                                                                            setIsRepoPopoverOpen(false);
                                                                        }}
                                                                    >
                                                                        <BookMarked className="size-4 shrink-0" />
                                                                        <span className="truncate">
                                                                            {repo.fullName || repo.name}
                                                                        </span>
                                                                        <Check
                                                                            className={cn(
                                                                                'ml-auto size-4',
                                                                                field.value?.id === repo.id
                                                                                    ? 'opacity-100'
                                                                                    : 'opacity-0',
                                                                            )}
                                                                        />
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </ScrollAreaWithShadow>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
