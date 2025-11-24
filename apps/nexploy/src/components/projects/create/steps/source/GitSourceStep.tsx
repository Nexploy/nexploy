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
import { Github, Gitlab, Link2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import useSWR from 'swr';
import { authClient } from '@/lib/auth/auth-client';
import { ManuelSource } from '@/components/projects/create/steps/source/ManuelSource';
import { ProviderSource } from '@/components/projects/create/steps/source/ProviderSource';
import { SocialAccount } from '@workspace/typescript-interface/auth/social-account';

export function GitSourceStep() {
    const { control } = useFormContext();

    const { data: accounts } = useSWR<SocialAccount[] | null>(
        'auth/listAccounts',
        async () => (await authClient.listAccounts()).data,
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Source Git</CardTitle>
                <CardDescription>Configuration du dépôt source</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={control}
                    name="gitProvider"
                    render={({ field }) => (
                        <FormItem>
                            <Tabs
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="github" className="gap-2">
                                        <Github /> GitHub
                                    </TabsTrigger>
                                    <TabsTrigger value="gitlab" className="gap-2">
                                        <Gitlab /> GitLab
                                    </TabsTrigger>
                                    <TabsTrigger value="manual" className="gap-2">
                                        <Link2 /> Manuel
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="github">
                                    <ProviderSource accounts={accounts} />
                                </TabsContent>
                                <TabsContent value="gitlab">
                                    <ProviderSource accounts={accounts} />
                                </TabsContent>
                                <TabsContent value="manual">
                                    <ManuelSource />
                                </TabsContent>
                            </Tabs>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
