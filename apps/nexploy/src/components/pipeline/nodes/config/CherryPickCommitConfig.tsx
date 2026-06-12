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
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { GitBranch } from '@workspace/typescript-interface/git/git';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { GitBranchIcon } from 'lucide-react';

interface RepositoryGitMeta {
    gitProvider: string;
    gitAccountId: string | null;
    gitId: string;
    name: string;
    branch: string;
}

export function CherryPickCommitConfig() {
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

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="commitHash"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('cherryPickCommitHash')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input
                                    {...field}
                                    placeholder={t('cherryPickCommitHashPlaceholder')}
                                />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="targetBranch"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('cherryPickTargetBranch')}</FormLabel>
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
                                    <SelectLabel>{t('cherryPickTargetBranch')}</SelectLabel>
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
            <FormField
                control={form.control}
                name="remote"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('gitRemote')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder={t('gitRemotePlaceholder')} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="noCommit"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('cherryPickNoCommit')}</FormLabel>
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
