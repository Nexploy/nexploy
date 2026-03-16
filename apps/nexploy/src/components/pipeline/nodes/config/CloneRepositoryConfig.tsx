'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
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
    SelectItem,
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

    const { data: repo } = useSWR<RepositoryGitMeta>(
        `/api/repositories/${params.repositoryId}`,
        fetcherApi,
    );

    const { data: branches, isLoading: isLoadingBranches } = useSWR<GitBranch[]>(
        repo?.gitAccountId
            ? `/api/git/branches?provider=${repo.gitProvider}&gitAccountId=${repo.gitAccountId}&repoId=${repo.gitId}&owner=${repo.name.split('/')[0]}&repoName=${repo.name.split('/')[1]}`
            : null,
        fetcherApi,
    );

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('cloneBranch')}</FormLabel>
                        <Select
                            value={field.value ?? ''}
                            onValueChange={(v) =>
                                field.onChange(v === '__default__' ? undefined : v)
                            }
                            disabled={isLoadingBranches || !repo}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    {isLoadingBranches ? (
                                        <span className="text-muted-foreground">
                                            {t('branchLoading')}
                                        </span>
                                    ) : (
                                        <SelectValue
                                            placeholder={
                                                repo
                                                    ? `${t('branchDefault')} (${repo.branch})`
                                                    : '...'
                                            }
                                        />
                                    )}
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="__default__">
                                    {repo
                                        ? `${t('branchDefault')} (${repo.branch})`
                                        : t('branchDefault')}
                                </SelectItem>
                                {branches?.map((branch) => (
                                    <SelectItem key={branch.name} value={branch.name}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
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
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder={t('cloneCommitHashPlaceholder')}
                            />
                        </FormControl>
                        <FormDescription>{t('cloneCommitHashDescription')}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
