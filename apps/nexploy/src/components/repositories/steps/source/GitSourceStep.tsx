'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { FormField, FormItem } from '@workspace/ui/components/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { GitBranch, Github, Gitlab } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import useSWR from 'swr';
import { ProviderSource } from '@/components/repositories/steps/source/ProviderSource';
import { useTranslations } from 'next-intl';
import { fetcherApi } from '@/lib/api/fetcherApi';

interface GitAccountSummary {
    id: string;
    provider: string;
    providerAccountId: string;
    providerUsername: string | null;
    gitProviderId: string;
}

export function GitSourceStep() {
    const { control, setValue } = useFormContext();
    const t = useTranslations('repository.steps.gitSource');

    const { data: accounts } = useSWR<GitAccountSummary[]>(
        '/api/git/accounts',
        fetcherApi,
    );

    const connectedProviders = accounts?.map((a) => a.provider) ?? [];

    return (
        <Card>
            <CardHeader>
                <div className={'flex gap-2'}>
                    <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <GitBranch className="text-primary size-5" />
                    </div>
                    <div className={'flex flex-col'}>
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={control}
                    name="gitProvider"
                    render={({ field }) => (
                        <FormItem>
                            <Tabs
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    setValue('repo', undefined);
                                    setValue('branch', 'main');
                                }}
                                defaultValue={field.value}
                                className="w-full"
                            >
                                <TabsList className="flex w-full">
                                    <TabsTrigger value="github" className="gap-2">
                                        <Github /> GitHub
                                    </TabsTrigger>
                                    <TabsTrigger value="gitlab" className="gap-2">
                                        <Gitlab /> GitLab
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="github">
                                    <ProviderSource connectedProviders={connectedProviders} />
                                </TabsContent>
                                <TabsContent value="gitlab">
                                    <ProviderSource connectedProviders={connectedProviders} />
                                </TabsContent>
                            </Tabs>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
