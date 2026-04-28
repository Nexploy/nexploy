'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { GitBranch } from '@workspace/typescript-interface/git/git';
import { GitBranchIcon } from 'lucide-react';

interface RepositoryGitMeta {
    gitProvider: string;
    gitAccountId: string | null;
    gitId: string;
    name: string;
    branch: string;
}

export function MergeBranchConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const params = useParams<{ repositoryId: string }>();

    const { data: repo, isLoading: isLoadingRepo } = useSWR<RepositoryGitMeta>(
        { url: `/api/repositories/${params.repositoryId}` },
        fetcherApi,
    );
    const { data: branches, isLoading: isLoadingBranches } = useSWR<GitBranch[]>(
        repo?.gitAccountId
            ? {
                  url: `/api/git/branches?provider=${repo.gitProvider}&gitAccountId=${repo.gitAccountId}&repoId=${repo.gitId}&owner=${repo.name.split('/')[0]}&repoName=${repo.name.split('/')[1]}`,
              }
            : null,
        fetcherApi,
    );

    const branchSelect = (name: string, labelKey: string) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{t(labelKey as any)}</FormLabel>
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
                                    <SelectValue placeholder={t('branchSelect')} />
                                )}
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{t(labelKey as any)}</SelectLabel>
                                {branches?.map((branch) => (
                                    <SelectItem key={branch.name} value={branch.name}>
                                        <div className="flex items-center gap-2">
                                            <GitBranchIcon />
                                            {branch.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                </FormItem>
            )}
        />
    );

    return (
        <div className="space-y-4">
            {branchSelect('sourceBranch', 'mergeSourceBranch')}
            {branchSelect('targetBranch', 'mergeTargetBranch')}
            <FormField
                control={form.control}
                name="strategy"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('mergeStrategy')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('mergeStrategy')}</SelectLabel>
                                    <SelectItem value="merge">{t('mergeStrategyMerge')}</SelectItem>
                                    <SelectItem value="squash">
                                        {t('mergeStrategySquash')}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('mergeMessage')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder={t('mergeMessagePlaceholder')}
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="remote"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('gitRemote')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="origin" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="push"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('mergePush')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
