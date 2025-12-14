'use client';

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
import { useFormContext } from 'react-hook-form';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { capitalizeFirstLetter } from '@/utils/capitalize';
import Link from 'next/link';
import { SocialAccount } from '@workspace/typescript-interface/auth/social-account';
import { GitBranch, GitRepository } from '@workspace/typescript-interface/git/git';

interface ProviderSourceProps {
    accounts?: SocialAccount[] | null;
}

export function ProviderSource({ accounts }: ProviderSourceProps) {
    const { control, watch, setValue } = useFormContext();

    const gitProvider = watch('gitProvider');
    const selectedRepo = watch('repo');

    const connectedProviders = accounts?.map((account) => account.providerId) || [];

    const { data: repos, isLoading: isLoadingRepos } = useSWR<GitRepository[]>(
        connectedProviders.includes(gitProvider)
            ? `/api/git/repositories?provider=${gitProvider}`
            : null,
        fetcherApi,
    );

    const { data: branches, isLoading: isLoadingBranches } = useSWR<GitBranch[]>(
        selectedRepo && connectedProviders.includes(gitProvider)
            ? `/api/git/branches?provider=${gitProvider}&repoId=${selectedRepo.id}&owner=${selectedRepo.fullName.split('/')[0]}&repoName=${selectedRepo.fullName.split('/')[1]}`
            : null,
        fetcherApi,
    );

    if (!connectedProviders.includes(gitProvider)) {
        return (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
                <div className="text-sm">
                    Vous n&apos;avez pas connecté de compte {capitalizeFirstLetter(gitProvider)}
                </div>
                <Button asChild>
                    <Link href="/integrations">Connecter {capitalizeFirstLetter(gitProvider)}</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 pt-4">
            <FormField
                control={control}
                name="repo"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Dépôt</FormLabel>
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
                                                ? 'Chargement...'
                                                : 'Sélectionner un dépôt'
                                        }
                                    />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {repos?.map((repo) => (
                                    <SelectItem key={repo.id} value={repo.id}>
                                        {repo.fullName || repo.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="branch"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Branche</FormLabel>
                        <Select
                            {...field}
                            value={branches && selectedRepo ? field.value : ''}
                            onValueChange={field.onChange}
                            disabled={!selectedRepo || isLoadingBranches}
                        >
                            <FormControl>
                                <SelectTrigger className={'min-w-32'}>
                                    <SelectValue placeholder={field.value} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
        </div>
    );
}
