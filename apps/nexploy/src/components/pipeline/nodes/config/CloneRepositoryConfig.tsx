'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { useEffect } from 'react';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { GitBranch } from '@workspace/typescript-interface/git/git';
import {
    FormControl,
    FormDescription,
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
import { Input } from '@workspace/ui/components/input';

interface RepositoryGitMeta {
    gitProvider: string;
    gitAccountId: string | null;
    gitId: string;
    name: string;
    branch: string;
}

export function CloneRepositoryConfig() {
    const t = useTranslations('repository.pipeline.config');
    const tCommon = useTranslations('common');

    const form = useFormContext();
    const params = useParams<{ repositoryId: string }>();

    const { data: repo, isLoading: isLoadingRepo } = useSWR<RepositoryGitMeta>(
        `/api/repositories/${params.repositoryId}`,
        fetcherApi,
    );
    const { data: branches, isLoading: isLoadingBranches } = useSWR<GitBranch[]>(
        repo?.gitAccountId
            ? `/api/git/branches?provider=${repo.gitProvider}&gitAccountId=${repo.gitAccountId}&repoId=${repo.gitId}&owner=${repo.name.split('/')[0]}&repoName=${repo.name.split('/')[1]}`
            : null,
        fetcherApi,
    );

    const currentBranch = form.getValues('branch');
    useEffect(() => {
        if (branches && branches.length > 0 && !currentBranch) {
            form.setValue('branch', branches[0]?.name);
        }
    }, [branches]);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('cloneBranch')}</FormLabel>
                        <Select
                            {...field}
                            onValueChange={field.onChange}
                            disabled={isLoadingRepo || isLoadingBranches || !repo}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    {isLoadingRepo ? (
                                        <span className="text-muted-foreground">
                                            {t('repoLoading')}
                                        </span>
                                    ) : isLoadingBranches ? (
                                        <span className="text-muted-foreground">
                                            {t('branchLoading')}
                                        </span>
                                    ) : (
                                        <SelectValue placeholder="..." />
                                    )}
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('cloneBranch')}</SelectLabel>
                                    {branches?.map((branch) => (
                                        <SelectItem key={branch.name} value={branch.name}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="commitHash"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            {t('cloneCommitHash')}
                            <span className="text-muted-foreground text-xs">
                                {tCommon('optional')}
                            </span>
                        </FormLabel>
                        <FormControl>
                            <Input {...field} placeholder={t('cloneCommitHashPlaceholder')} />
                        </FormControl>
                        <FormDescription>{t('cloneCommitHashDescription')}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
