'use client';

import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Globe, Hammer, Key, Settings, Tag, Workflow } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { ReactNode, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

const VALID_TABS = [
    'builds',
    'versions',
    'env',
    'domain',
    'pipeline',
    'setting',
] as const;
type TabValue = (typeof VALID_TABS)[number];

interface RepositoryTabsProps {
    children: {
        builds: ReactNode;
        versions: ReactNode;
        env: ReactNode;
        domain: ReactNode;
        pipeline: ReactNode;
        setting: ReactNode;
    };
}

export function RepositoryTabs({ children }: RepositoryTabsProps) {
    const t = useTranslations('repository.tabs');
    const searchParams = useSearchParams();
    const [tab, setTab] = useQueryState(
        'tab',
        parseAsStringLiteral(VALID_TABS).withDefault('pipeline'),
    );

    useEffect(() => {
        const urlTab = searchParams.get('tab') as TabValue | null;
        if (urlTab && VALID_TABS.includes(urlTab) && urlTab !== tab) {
            setTab(urlTab);
        }
    }, [searchParams]);

    return (
        <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as TabValue)}
            className="flex flex-1 flex-col overflow-hidden"
        >
            <div className={'mx-5 flex flex-col justify-between gap-1 lg:flex-row lg:gap-2'}>
                <div className={'flex gap-2'}>
                    <TabsList className="mb-2">
                        <TabsTrigger value="pipeline">
                            <Workflow />
                            {t('pipeline')}
                        </TabsTrigger>
                    </TabsList>
                    <TabsList className="mb-2">
                        <div className={'flex gap-2'}>
                            <TabsTrigger value="builds">
                                <Hammer />
                                {t('builds')}
                            </TabsTrigger>
                            <TabsTrigger value="versions">
                                <Tag />
                                {t('versions')}
                            </TabsTrigger>
                            <TabsTrigger value="env">
                                <Key />
                                {t('environments')}
                            </TabsTrigger>
                            <TabsTrigger value="domain">
                                <Globe />
                                {t('domains')}
                            </TabsTrigger>
                        </div>
                    </TabsList>
                </div>
                <TabsList className="mb-2">
                    <TabsTrigger value="setting">
                        <Settings />
                        {t('settings')}
                    </TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="pipeline">{children.pipeline}</TabsContent>
            <TabsContent value="builds" className={'flex flex-1 overflow-hidden'}>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="pb-5">{children.builds}</div>
                </ScrollAreaWithShadow>
            </TabsContent>
            <TabsContent value="versions" className={'flex flex-1 overflow-hidden'}>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="pb-5">{children.versions}</div>
                </ScrollAreaWithShadow>
            </TabsContent>
            <TabsContent value="env" className={'flex flex-1 overflow-hidden'}>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="pb-5">{children.env}</div>
                </ScrollAreaWithShadow>
            </TabsContent>
            <TabsContent value="domain" className={'flex flex-1 overflow-hidden'}>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="pb-5">{children.domain}</div>
                </ScrollAreaWithShadow>
            </TabsContent>
            <TabsContent value="setting" className={'flex flex-1 overflow-hidden'}>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="pb-5">{children.setting}</div>
                </ScrollAreaWithShadow>
            </TabsContent>
        </Tabs>
    );
}
