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
import { authClient } from '@/lib/auth/auth-client';
import { ProviderSource } from '@/components/repositories/steps/source/ProviderSource';
import { SocialAccount } from '@workspace/typescript-interface/auth/social-account';

export function GitSourceStep() {
    const { control, setValue } = useFormContext();

    const { data: accounts } = useSWR<SocialAccount[] | null>(
        'auth/listAccounts',
        async () => (await authClient.listAccounts()).data,
    );

    return (
        <Card>
            <CardHeader>
                <div className={'flex gap-2'}>
                    <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <GitBranch className="text-primary size-5" />
                    </div>
                    <div className={'flex flex-col'}>
                        <CardTitle>Source Git</CardTitle>
                        <CardDescription>Configuration du dépôt source</CardDescription>
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
                                    {/*<TabsTrigger value="manual" className="gap-2">*/}
                                    {/*    <Link2 /> Manuel*/}
                                    {/*</TabsTrigger>*/}
                                </TabsList>
                                <TabsContent value="github">
                                    <ProviderSource accounts={accounts} />
                                </TabsContent>
                                <TabsContent value="gitlab">
                                    <ProviderSource accounts={accounts} />
                                </TabsContent>
                                {/*<TabsContent value="manual">*/}
                                {/*    <ManuelSource />*/}
                                {/*</TabsContent>*/}
                            </Tabs>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
