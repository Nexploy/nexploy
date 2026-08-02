'use client';

import { useNodeResource } from '@workspace/pipeline-ui/adapter';
import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
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
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';
import { GitBranch } from '@workspace/typescript-interface/git/git';
import { GitBranchIcon } from 'lucide-react';

interface RepositoryGitMeta {
    gitProvider: string;
    gitAccountId: string | null;
    gitId: string;
    name: string;
    branch: string;
    repositoryUrl: string;
}

export function CreateReleaseConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const params = useParams<{ repositoryId: string }>();

    const { data: repo, isLoading: isLoadingRepo } = useNodeResource<RepositoryGitMeta>(
        `/api/repositories/${params.repositoryId}`,
    );
    const { data: branches, isLoading: isLoadingBranches } = useNodeResource<GitBranch[]>(
        repo?.gitAccountId
            ? `/api/git/branches?provider=${repo.gitProvider}&gitAccountId=${repo.gitAccountId}&repoId=${repo.gitId}&owner=${repo.name.split('/')[0]}&repoName=${repo.name.split('/')[1]}&repositoryUrl=${encodeURIComponent(repo.repositoryUrl)}`
            : null,
    );

    const currentBranch = form.getValues('targetBranch');
    useEffect(() => {
        if (branches && branches.length > 0 && !currentBranch) {
            form.setValue('targetBranch', branches[0]?.name);
        }
    }, [branches]);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="tagName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('releaseTagName')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('releaseTagNamePlaceholder')} />
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
                        <FormLabel>{t('releaseTargetBranch')}</FormLabel>
                        <Select
                            {...field}
                            onValueChange={field.onChange}
                            disabled={isLoadingRepo || isLoadingBranches || !repo}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    {isLoadingRepo ? (
                                        <span className="text-muted-foreground">{t('repoLoading')}</span>
                                    ) : isLoadingBranches ? (
                                        <span className="text-muted-foreground">{t('branchLoading')}</span>
                                    ) : (
                                        <SelectValue placeholder={t('branchSelect')} />
                                    )}
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('releaseTargetBranch')}</SelectLabel>
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
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="releaseTitle"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('releaseTitle')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('releaseTitlePlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="releaseNotes"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('releaseNotes')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Textarea {...field} placeholder={t('releaseNotesPlaceholder')} rows={5} />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="draft"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('releaseDraft')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="prerelease"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('releasePrerelease')}</FormLabel>
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
