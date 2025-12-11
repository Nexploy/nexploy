'use client';

import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Globe, Hammer, Key, Rocket, Settings, Tag } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { ReactNode } from 'react';

const VALID_TABS = ['overview', 'versions', 'env', 'domain', 'deployment', 'setting'] as const;
type TabValue = (typeof VALID_TABS)[number];

interface RepositoryTabsProps {
    children: {
        overview: ReactNode;
        versions: ReactNode;
        env: ReactNode;
        domain: ReactNode;
        deployment: ReactNode;
        setting: ReactNode;
    };
}

export function RepositoryTabs({ children }: RepositoryTabsProps) {
    const [tab, setTab] = useQueryState(
        'tab',
        parseAsStringLiteral(VALID_TABS).withDefault('overview'),
    );

    return (
        <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as TabValue)}
            className="flex flex-1 flex-col overflow-hidden"
        >
            <div className={'flex justify-between'}>
                <TabsList className="mx-5 mb-2">
                    <div className={'flex gap-2'}>
                        <TabsTrigger value="overview">
                            <Hammer />
                            Builds
                        </TabsTrigger>
                        <TabsTrigger value="versions">
                            <Tag />
                            Versions
                        </TabsTrigger>
                        <TabsTrigger value="env">
                            <Key />
                            Environments
                        </TabsTrigger>
                        <TabsTrigger value="domain">
                            <Globe />
                            Domains
                        </TabsTrigger>
                        <TabsTrigger value="deployment">
                            <Rocket />
                            Deployment
                        </TabsTrigger>
                    </div>
                </TabsList>
                <TabsList className="mx-5 mb-2">
                    <TabsTrigger value="setting">
                        <Settings />
                        Settings
                    </TabsTrigger>
                </TabsList>
            </div>
            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <div className="pb-5">
                    <TabsContent value="overview" className="mt-0">
                        {children.overview}
                    </TabsContent>
                    <TabsContent value="versions" className="mt-0">
                        {children.versions}
                    </TabsContent>
                    <TabsContent value="env" className="mt-0">
                        {children.env}
                    </TabsContent>
                    <TabsContent value="domain" className="mt-0">
                        {children.domain}
                    </TabsContent>
                    <TabsContent value="deployment" className="mt-0">
                        {children.deployment}
                    </TabsContent>
                    <TabsContent value="setting" className="mt-0">
                        {children.setting}
                    </TabsContent>
                </div>
            </ScrollAreaWithShadow>
        </Tabs>
    );
}
