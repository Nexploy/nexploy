'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { GitBranch as GitBranchIcon, Save } from 'lucide-react';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { GitBranch } from '@workspace/typescript-interface/git/git';
import { Repository } from 'generated/client';
import {
    Form,
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
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { branchSchema } from '@workspace/schemas-zod/repository/branch.schema';
import { updateBranchAction } from '@/actions/repository/settings/updateBranch.action';
import { useEffect } from 'react';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';

interface ChangeBranchProps {
    repository: Repository;
}

export function ChangeBranch({ repository }: ChangeBranchProps) {
    const { data: branches, isLoading: isLoadingBranches } = useSWR<GitBranch[]>(
        `/api/git/branches?provider=${repository.gitProvider}&repoId=${repository.gitId}&owner=${repository.name.split('/')[0]}&repoName=${repository.name.split('/')[1]}`,
        fetcherApi,
    );

    const bindUpdateBranchAction = updateBranchAction.bind(null, repository.id);
    const { form, action, handleSubmitWithAction } = useHookFormAction(
        bindUpdateBranchAction,
        zodResolver(branchSchema),
        {
            formProps: {
                defaultValues: {
                    branch: repository.branch,
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) form.reset({ branch: data });
                },
            },
        },
    );

    useEffect(() => {
        if (branches && branches.length > 0) {
            const currentBranch = form.getValues('branch');
            const branchExists = branches.some((branch) => branch.name === currentBranch);

            if (!branchExists) {
                form.setValue('branch', branches[0]?.name, { shouldDirty: true });
            }
        }
    }, [branches, form]);

    return (
        <Card>
            <CardHeaderWithIcon
                icon={GitBranchIcon}
                title={'Branche de déploiement'}
                description={'Modifiez la branche utilisée pour les builds et déploiements'}
            />
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="branch"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Branche</FormLabel>
                                    <Select
                                        {...field}
                                        onValueChange={field.onChange}
                                        disabled={isLoadingBranches}
                                    >
                                        <FormControl>
                                            <SelectTrigger className={'min-w-32'}>
                                                {isLoadingBranches ? (
                                                    <span className="text-muted-foreground">
                                                        Chargement...
                                                    </span>
                                                ) : (
                                                    <SelectValue />
                                                )}
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {branches?.map((branch) => (
                                                <SelectItem key={branch.name} value={branch.name}>
                                                    <GitBranchIcon />
                                                    {branch.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                icon={Save}
                                disabled={
                                    action.isPending || isLoadingBranches || !form.formState.isDirty
                                }
                            >
                                {action.isPending ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
